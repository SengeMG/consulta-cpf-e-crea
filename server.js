import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import consultaCrea from './api/consulta-crea.js';
import consultaCnpj from './api/consulta-cnpj.js';
import consultaExterna from './api/consulta-externa.js';
import consultaCep from './api/consulta-cep.js';
import healthDb from './api/health-db.js';
import { serverConfig } from './config/index.js';
import {
  createRateLimit,
  corsMiddleware,
  helmetMiddleware,
  securityLogger,
  sanitizeInput,
  inputValidation
} from './middleware/security.js';

import { db } from './api/db.js'; // Importação estática do DB

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middlewares de Segurança
app.use(helmetMiddleware);
// app.use(createRateLimit()); // REMOVIDO: Rate Limit global
app.use(securityLogger);
app.use(sanitizeInput);
app.use(corsMiddleware);

// Instância do Rate Limit para rotas específicas
const cpfRateLimit = createRateLimit();

// Rotas da API com validação e Rate Limit APENAS para consulta CPF externa
app.get('/api/consulta-externa', cpfRateLimit, inputValidation('cpf'), (req, res) => consultaExterna(req, res));

// Rota CREA sem rate limit (apenas retorna URL para redirecionamento)
app.get('/api/consulta-crea', (req, res) => consultaCrea(req, res));

// Rotas SEM Rate Limit (Ilimitadas)
app.get('/api/consulta-cnpj', inputValidation('cnpj'), (req, res) => consultaCnpj(req, res));
app.get('/api/consulta-cep', inputValidation('cep'), (req, res) => consultaCep(req, res));

// Endpoint de Status (Read-Only) - GLOBAL
app.get('/api/status', async (req, res) => {
  try {
    const globalKey = 'global_shared_limit';
    const limits = await db.get(globalKey);
    
    const minuteLimit = 5;
    const dailyLimit = 100;

    // Retorna contadores reais (não remaining)
    res.setHeader('X-RateLimit-Minute-Count', limits.minute.count);
    res.setHeader('X-RateLimit-Minute-Limit', minuteLimit);
    res.setHeader('X-RateLimit-Daily-Count', limits.daily.count);
    res.setHeader('X-RateLimit-Daily-Limit', dailyLimit);

    res.json({ 
      success: true, 
      limits: {
        minute: { count: limits.minute.count, limit: minuteLimit },
        daily: { count: limits.daily.count, limit: dailyLimit }
      },
      scope: 'global' 
    });
  } catch (err) {
    console.error('[STATUS] Error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Endpoint de Debug - Lista todos os registros de rate limit
app.get('/api/debug/rate-limits', async (req, res) => {
  try {
    const allRecords = await db.getAll();
    const globalRecord = allRecords.find(r => r.key === 'global_shared_limit');
    res.json({ 
      success: true,
      scope: 'global',
      globalLimit: globalRecord || null,
      totalRecords: allRecords.length,
      records: allRecords 
    });
  } catch (err) {
    console.error('[DEBUG] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health Check Inline para Debug
app.get('/api/health', async (req, res) => {
  console.log('[HEALTH] Checking health...');
  try {
    const results = { status: 'checking' };
    try {
      const limits = await db.increment('health-check', 60000, 86400000);
      results.db = { success: true, limits };
    } catch (e) {
      console.error('[HEALTH] DB Error:', e);
      results.db = { success: false, error: e.message };
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health-db', (req, res) => healthDb(req, res));

// Servir arquivos estáticos da pasta public
app.use(express.static(join(__dirname, 'public')));

// Rota para qualquer outra requisição, servir o index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(serverConfig.port, () => {
  console.log(`🔒 Servidor seguro rodando em http://localhost:${serverConfig.port}`);
  console.log(`🌍 Ambiente: ${serverConfig.nodeEnv}`);
  console.log(`🚀 Sistema de consulta CPF/CNPJ iniciado com segurança`);
});
