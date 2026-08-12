import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

dotenv.config({ path: join(rootDir, '.env') });

const requiredEnvVars = ['SECRET_KEY', 'DATABASE_URL'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente obrigatória não encontrada: ${envVar}`);
  }
}

const externalCpfApiKey =
  process.env.CPF_API_KEY;

if (!externalCpfApiKey) {
  throw new Error('Variável de ambiente obrigatória não encontrada: CPF_API_KEY');
}

export const serverConfig = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
};

export const securityConfig = {
  secretKey: process.env.SECRET_KEY,
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
  },
  rateLimit: {
    windowMs: 60000,
    maxRequests: 5,
    dailyWindowMs: 24 * 60 * 60 * 1000,
    maxDailyRequests: 100,
    message: {
      error: 'Limite de consultas atingido. Tente novamente mais tarde.',
      code: 'rate_limit_exceeded',
    },
  },
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://consulta-cpf-e-crea.vercel.app', 'https://vitals.vercel-insights.com'],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  },
};

export const apiConfig = {
  externalApi: {
    baseUrl: process.env.CPF_API_BASE_URL || 'https://apicpf.com/api/consulta',
    apiKey: externalCpfApiKey,
  },
  cnpjApi: {
    baseUrl: process.env.CNPJ_API_BASE_URL || 'https://receitaws.com.br/v1/cnpj',
  },
  cepApi: {
    baseUrl: process.env.CEP_API_BASE_URL || 'https://viacep.com.br/ws',
    timeout: parseInt(process.env.CEP_API_TIMEOUT, 10) || 5000,
  },
  crea: {
    url: process.env.CREA_URL || 'https://crea-mg.sitac.com.br/?servico=profissionais-cadastrados',
    timeout: parseInt(process.env.PUPPETEER_TIMEOUT, 10) || 20000,
    headless: process.env.BROWSER_HEADLESS === 'true',
  },
};

function validateCpfDigits(cpf) {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calculateDigit = (base) => {
    const sum = base.split('').reduce((total, digit, index) => {
      return total + Number(digit) * (base.length + 1 - index);
    }, 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(cpf.slice(0, 9)) === Number(cpf[9]) &&
    calculateDigit(cpf.slice(0, 10)) === Number(cpf[10]);
}

function validateCnpjDigits(cnpj) {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calculateDigit = (base, weights) => {
    const sum = base.split('').reduce((total, digit, index) => {
      return total + Number(digit) * weights[index];
    }, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return firstDigit === Number(cnpj[12]) && secondDigit === Number(cnpj[13]);
}

export const validationRules = {
  cpf: {
    required: true,
    minLength: 11,
    maxLength: 14,
    pattern: /^[\d\s.\-]{11,14}$/,
    customValidator: validateCpfDigits,
  },
  cnpj: {
    required: true,
    minLength: 14,
    maxLength: 18,
    pattern: /^[\d\s.\/\-]{14,18}$/,
    customValidator: validateCnpjDigits,
  },
  cep: {
    required: true,
    minLength: 8,
    maxLength: 9,
    pattern: /^[\d\-]{8,9}$/,
    customValidator: (cep) => {
      const digits = cep.replace(/\D/g, '');
      return digits.length === 8 && !/^(\d)\1{7}$/.test(digits);
    },
  },
};

export const validateInput = (input, type) => {
  const rule = validationRules[type];
  if (!rule) return { valid: false, message: 'Tipo de validação inválido' };

  if (!input) {
    return { valid: false, message: 'Entrada obrigatória' };
  }

  const cleanInput = input.replace(/\D/g, '');

  if (cleanInput.length < rule.minLength || cleanInput.length > rule.maxLength) {
    return { valid: false, message: `Formato inválido. Use ${type.toUpperCase()} válido` };
  }

  if (rule.pattern && !rule.pattern.test(input)) {
    return { valid: false, message: `Formato ${type.toUpperCase()} inválido` };
  }

  if (rule.customValidator && !rule.customValidator(cleanInput)) {
    return { valid: false, message: `${type.toUpperCase()} inválido` };
  }

  return { valid: true };
};

export default {
  serverConfig,
  securityConfig,
  apiConfig,
  validationRules,
  validateInput,
};
