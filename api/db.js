import pkg from 'pg';
const { Pool } = pkg;
import { serverConfig } from '../config/index.js';

// Configuração do Pool de Conexões (Serverless-friendly)
const pool = new Pool({
    connectionString: serverConfig.databaseUrl,
    ssl: {
        rejectUnauthorized: false
    },
    max: 1, // Em serverless, manter baixo para não estourar conexões do Neon
    idleTimeoutMillis: 30000
});

// Inicialização Lazy da Tabela
let tableInitialized = false;

const initTable = async () => {
    if (tableInitialized) return;

    try {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS rate_limits (
                    key VARCHAR(255) PRIMARY KEY,
                    minute_count INT DEFAULT 0,
                    minute_reset BIGINT DEFAULT 0,
                    daily_count INT DEFAULT 0,
                    daily_reset BIGINT DEFAULT 0
                );
            `);
            tableInitialized = true;
            console.log('[DB] Tabela rate_limits inicializada/verificada.');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('[DB] Erro ao inicializar tabela:', error);
    }
};

class PostgresDB {

    async increment(key, minuteWindowMs, dailyWindowMs) {
        await initTable();

        const now = Date.now();

        // Calcular meia-noite do próximo dia (00:00 UTC-3 = 03:00 UTC)
        const getNextMidnightBrasilia = () => {
            const now = new Date();
            // Horário atual em UTC
            const utcHours = now.getUTCHours();
            const utcDate = now.getUTCDate();
            const utcMonth = now.getUTCMonth();
            const utcYear = now.getUTCFullYear();
            
            // Meia-noite de Brasília = 03:00 UTC
            // Se agora é antes das 03:00 UTC, reset é hoje às 03:00 UTC
            // Se agora é depois das 03:00 UTC, reset é amanhã às 03:00 UTC
            let resetDate = new Date(Date.UTC(utcYear, utcMonth, utcDate, 3, 0, 0, 0));
            
            if (now.getTime() >= resetDate.getTime()) {
                // Já passou das 03:00 UTC (00:00 Brasília), reset é amanhã
                resetDate = new Date(resetDate.getTime() + 24 * 60 * 60 * 1000);
            }
            
            return resetDate.getTime();
        };

        const nextMidnight = getNextMidnightBrasilia();

        // key agora é passado dinamicamente (IP do cliente)

        // Lógica Atômica SQL com UPSERT (ON CONFLICT)
        const query = `
            INSERT INTO rate_limits (key, minute_count, minute_reset, daily_count, daily_reset)
            VALUES ($1, 1, $2, 1, $3)
            ON CONFLICT (key) DO UPDATE SET
                minute_count = CASE 
                    WHEN rate_limits.minute_reset < $4 THEN 1 
                    ELSE rate_limits.minute_count + 1 
                END,
                minute_reset = CASE 
                    WHEN rate_limits.minute_reset < $4 THEN $2 
                    ELSE rate_limits.minute_reset 
                END,
                daily_count = CASE 
                    WHEN rate_limits.daily_reset < $4 THEN 1 
                    ELSE rate_limits.daily_count + 1 
                END,
                daily_reset = CASE 
                    WHEN rate_limits.daily_reset < $4 THEN $3 
                    ELSE rate_limits.daily_reset 
                END
            RETURNING minute_count as minute, daily_count as daily;
        `;

        const values = [
            key,
            now + minuteWindowMs, // $2: Novo reset min
            nextMidnight,         // $3: Novo reset dia (00:00 UTC-3)
            now                   // $4: Timestamp atual para comparação
        ];

        try {
            const result = await pool.query(query, values);
            const row = result.rows[0];
            
            // Log para debug
            console.log('[DB INCREMENT] Key:', key, 'New Minute:', row.minute, 'New Daily:', row.daily, 
                'NextReset:', new Date(nextMidnight).toISOString());

            return {
                minute: { count: row.minute },
                daily: { count: row.daily }
            };
        } catch (error) {
            console.error('[DB] Erro no incremento Postgres:', error);
            // Fallback seguro (Fail Open)
            return {
                minute: { count: 1 },
                daily: { count: 1 }
            };
        }
    }

    async get(key) {
        await initTable();
        try {
            const query = 'SELECT minute_count, minute_reset, daily_count, daily_reset FROM rate_limits WHERE key = $1';
            const result = await pool.query(query, [key]);

            if (result.rows.length > 0) {
                const row = result.rows[0];
                const now = Date.now();
                
                // Verifica se os períodos já resetaram
                const minuteCount = (row.minute_reset && row.minute_reset < now) ? 0 : row.minute_count;
                const dailyCount = (row.daily_reset && row.daily_reset < now) ? 0 : row.daily_count;
                
                console.log('[DB GET] Key:', key, 'Minute:', minuteCount, 'Daily:', dailyCount,
                    'MinuteReset:', row.minute_reset ? new Date(Number(row.minute_reset)).toISOString() : 'N/A',
                    'DailyReset:', row.daily_reset ? new Date(Number(row.daily_reset)).toISOString() : 'N/A');
                
                return {
                    minute: { count: minuteCount },
                    daily: { count: dailyCount }
                };
            }
            return { minute: { count: 0 }, daily: { count: 0 } };
        } catch (error) {
            console.error('[DB] Erro ao buscar limites:', error);
            return { minute: { count: 0 }, daily: { count: 0 } };
        }
    }

    async getAll() {
        await initTable();
        try {
            const query = 'SELECT key, minute_count, minute_reset, daily_count, daily_reset FROM rate_limits ORDER BY daily_count DESC LIMIT 50';
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('[DB] Erro ao buscar todos os limites:', error);
            return [];
        }
    }
}

export const db = new PostgresDB();
