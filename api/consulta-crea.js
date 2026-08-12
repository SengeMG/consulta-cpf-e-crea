// URL externa do CREA-MG para redirecionamento
const CREA_EXTERNAL_URL = 'https://crea-mg.sitac.com.br/app/view/sight/externo?form=PesquisarProfissionalEmpresa';

// Nossa função principal - agora apenas retorna a URL para redirecionamento
export default async function handler(req, res) {
    // Configurações de CORS já são tratadas pelo middleware
    // Rate Limit é gerenciado exclusivamente pelo middleware do Express (server.js)

    // Responde imediatamente para requisições OPTIONS (pré-voo)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Retorna a URL externa para o frontend redirecionar
    // O scraping foi removido pois não funciona na Vercel (sem Puppeteer)
    return res.status(200).json({
        redirect: true,
        url: CREA_EXTERNAL_URL,
        message: 'Redirecionando para o site oficial do CREA-MG'
    });
}