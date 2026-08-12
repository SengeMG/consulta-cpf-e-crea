import { apiConfig, securityConfig } from '../config/index.js';

function validarCPFDigitos(cpf) {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calcularDigito = (base) => {
    const soma = base.split('').reduce((total, digito, indice) => {
      return total + Number(digito) * (base.length + 1 - indice);
    }, 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calcularDigito(cpf.slice(0, 9)) === Number(cpf[9]) &&
    calcularDigito(cpf.slice(0, 10)) === Number(cpf[10]);
}

export default async function consultaExterna(req, res) {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  console.log('[CONSULTA EXTERNA] Request from IP:', clientIp);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { cpf } = req.query;
  const cpfLimpo = cpf?.replace(/\D/g, '') || '';

  if (!cpf || cpfLimpo.length !== 11 || !validarCPFDigitos(cpfLimpo)) {
    return res.status(400).json({
      error: 'CPF inválido ou não fornecido.',
      code: 'invalid_cpf'
    });
  }

  try {
    console.log(`[EXTERNAL API] Consultando CPF: ${cpfLimpo}`);

    const response = await fetch(`${apiConfig.externalApi.baseUrl}?cpf=${cpfLimpo}`, {
      headers: {
        'X-API-KEY': apiConfig.externalApi.apiKey,
        'Accept': 'application/json',
        'User-Agent': 'SENGE-MG-Consulta/1.0'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`API externa retornou status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      return res.status(404).json({
        error: data.error || 'CPF não encontrado',
        code: data.code || 'not_found'
      });
    }

    // Formata os dados de acordo com o formato esperado pelo frontend
    const formattedData = {
      nome: data.data?.nome || data.nome || 'NÃO ENCONTRADO',
      genero: data.data?.genero || data.genero || '',
      data_nascimento: data.data?.data_nascimento || data.data_nascimento || '',
      cpf: cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    };

    console.log(`[EXTERNAL API] Sucesso na consulta do CPF: ${cpfLimpo}`);
    return res.status(200).json(formattedData);

  } catch (error) {
    console.error('[EXTERNAL API] Erro na consulta externa:', error);
    return res.status(500).json({
      error: 'Erro interno na consulta externa',
      details: error.message,
      code: 'external_api_error'
    });
  }
}
