import helmet from 'helmet';
import { securityConfig } from '../config/index.js';
import { db } from '../api/db.js';

// Core Rate Limit Logic reusable in Handlers
export const checkRateLimit = async (req, res) => {
  try {
    const minuteWindow = securityConfig.rateLimit.windowMs;
    const dailyWindow = securityConfig.rateLimit.dailyWindowMs;

    // Rate limit GLOBAL (compartilhado por todos os usuários)
    const globalKey = 'global_shared_limit';
    console.log('[RATE LIMIT] Checking GLOBAL limit for URL:', req.url);

    // Incrementa e obtém estado atual
    const limits = await db.increment(globalKey, minuteWindow, dailyWindow);
    console.log('[RATE LIMIT] After increment - Minute:', limits.minute.count, 'Daily:', limits.daily.count);

    const minuteLimit = securityConfig.rateLimit.maxRequests;
    const dailyLimit = securityConfig.rateLimit.maxDailyRequests;

    // Define headers informativos (COUNT ao invés de REMAINING)
    res.setHeader('X-RateLimit-Minute-Count', limits.minute.count);
    res.setHeader('X-RateLimit-Minute-Limit', minuteLimit);
    res.setHeader('X-RateLimit-Daily-Count', limits.daily.count);
    res.setHeader('X-RateLimit-Daily-Limit', dailyLimit);

    // Verifica violações
    let errorDetail = null;
    if (limits.minute.count > minuteLimit) {
      errorDetail = 'Limite por minuto excedido';
    } else if (limits.daily.count > dailyLimit) {
      errorDetail = 'Limite diário excedido';
    }

    if (errorDetail) {
      console.warn(`[SECURITY] ${errorDetail} (Global) at ${new Date().toISOString()}`);
      return { blocked: true, errorDetail };
    }

    return { blocked: false };
  } catch (error) {
    console.error('[SECURITY] Erro no rate limit:', error);
    // Fallback seguro
    return { blocked: false };
  }
};

// Middleware para Express (server.js)
export const createRateLimit = () => {
  return async (req, res, next) => {
    // Bypass para health checks e testes
    if (req.query.test === 'true') {
      return next();
    }

    const result = await checkRateLimit(req, res);

    if (result.blocked) {
      return res.status(429).json({
        ...securityConfig.rateLimit.message,
        detail: result.errorDetail
      });
    }

    next();
  };
};

// Middleware de CORS configurado
export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = securityConfig.cors.allowedOrigins;

  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.header('Access-Control-Allow-Origin', allowedOrigins[0] || '*');
  }

  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Expose-Headers', 'X-RateLimit-Minute-Count, X-RateLimit-Minute-Limit, X-RateLimit-Daily-Count, X-RateLimit-Daily-Limit');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

// Middleware de Helmet (headers de segurança)
export const helmetMiddleware = helmet(securityConfig.helmet);

// Middleware de logging de segurança
export const securityLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: duration + 'ms'
    };

    // Log de alertas de segurança
    if (res.statusCode >= 400) {
      console.warn('[SECURITY WARNING]', logData);
    } else {
      console.log('[ACCESS]', `${logData.method} ${logData.url} - ${logData.statusCode} - ${logData.duration}`);
    }
  });

  next();
};

// Middleware de validação de entrada
export const inputValidation = (type) => {
  return async (req, res, next) => {
    // Permite bypass para testes de health check
    if (req.query.test === 'true') return next();

    const { validateInput } = await import('../config/index.js');
    // Usa o próprio tipo como nome do parâmetro (cpf, cnpj ou cep)
    const paramName = type;
    const inputValue = req.query[paramName];

    const validation = validateInput(inputValue, type);

    if (!validation.valid) {
      console.warn(`[SECURITY] Invalid ${type} input from ${req.ip}: ${validation.message}`);
      return res.status(400).json({
        error: validation.message,
        code: `invalid_${type}`
      });
    }

    next();
  };
};

// Middleware para sanitizar entrada
export const sanitizeInput = (req, res, next) => {
  // Remove caracteres potencialmente perigosos
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>"']/g, '').trim();
  };

  // Sanitiza parâmetros da query
  Object.keys(req.query).forEach(key => {
    req.query[key] = sanitizeString(req.query[key]);
  });

  // Sanitiza headers importantes
  if (req.headers['user-agent']) {
    req.headers['user-agent'] = sanitizeString(req.headers['user-agent']);
  }

  next();
};
