import pkg from 'pg';
const { Pool } = pkg;
import { serverConfig } from '../config/index.js';
import { db } from './db.js';

export default async function handler(req, res) {
    const results = {
        config: {
            hasUrl: !!serverConfig.databaseUrl,
            urlPrefix: serverConfig.databaseUrl?.substring(0, 20) + '...'
        },
        directConnection: null,
        dbModule: null
    };

    // Teste 1: Conexão Direta
    try {
        const pool = new Pool({
            connectionString: serverConfig.databaseUrl,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
        });
        const client = await pool.connect();
        const timeRes = await client.query('SELECT NOW()');
        client.release();
        await pool.end();
        results.directConnection = { success: true, time: timeRes.rows[0].now };
    } catch (e) {
        results.directConnection = { success: false, error: e.message, stack: e.stack };
    }

    // Teste 2: Via Módulo DB
    try {
        const limits = await db.increment('health-check-db', 60000, 86400000); // Teste com incremento real
        results.dbModule = { success: true, limits };
    } catch (e) {
        results.dbModule = { success: false, error: e.message };
    }

    res.status(200).json(results);
}
