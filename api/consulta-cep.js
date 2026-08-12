import { apiConfig } from '../config/index.js';

/**
 * API de Consulta de CEP
 * Utiliza a ViaCEP (gratuita e sem necessidade de API key)
 * https://viacep.com.br/
 */

export default async function consultaCep(req, res) {
    const { cep } = req.query;

    if (!cep) {
        return res.status(400).json({
            error: 'CEP é obrigatório',
            code: 'missing_cep'
        });
    }

    // Limpar CEP (remove traços e espaços)
    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
        return res.status(400).json({
            error: 'CEP deve ter 8 dígitos',
            code: 'invalid_cep_format'
        });
    }

    try {
        console.log(`[CEP API] Consultando CEP: ${cepLimpo}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), apiConfig.cepApi.timeout);

        const response = await fetch(
            `${apiConfig.cepApi.baseUrl}/${cepLimpo}/json/`,
            {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`[CEP API] Erro HTTP: ${response.status}`);
            return res.status(response.status).json({
                error: 'Erro ao consultar CEP',
                code: 'api_error',
                status: response.status
            });
        }

        const data = await response.json();

        // ViaCEP retorna { erro: true } quando CEP não existe
        if (data.erro) {
            console.log(`[CEP API] CEP não encontrado: ${cepLimpo}`);
            return res.status(404).json({
                error: 'CEP não encontrado',
                code: 'cep_not_found',
                cep: cepLimpo
            });
        }

        console.log(`[CEP API] CEP encontrado: ${cepLimpo} - ${data.localidade}/${data.uf}`);

        // Retornar dados formatados
        return res.status(200).json({
            success: true,
            data: {
                cep: data.cep,
                logradouro: data.logradouro || '',
                complemento: data.complemento || '',
                bairro: data.bairro || '',
                localidade: data.localidade,
                cidade: data.localidade, // Alias para facilitar uso
                uf: data.uf,
                estado: data.uf, // Alias para facilitar uso
                ibge: data.ibge,
                gia: data.gia || '',
                ddd: data.ddd,
                siafi: data.siafi
            },
            fonte: 'ViaCEP',
            consultadoEm: new Date().toISOString()
        });

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`[CEP API] Timeout ao consultar CEP: ${cepLimpo}`);
            return res.status(504).json({
                error: 'Tempo limite excedido ao consultar CEP',
                code: 'timeout'
            });
        }

        console.error(`[CEP API] Erro ao consultar CEP: ${error.message}`);
        return res.status(500).json({
            error: 'Erro interno ao consultar CEP',
            code: 'internal_error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
