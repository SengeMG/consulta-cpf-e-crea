/**
 * Mensagem de Marketing para Desenvolvedores curiosos
 */
(function () {
    const styles = [
        'background: linear-gradient(135deg, #0b5ed7, #2c7be5)',
        'color: white',
        'display: block',
        'text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3)',
        'box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4) inset, 0 5px 3px -5px rgba(0, 0, 0, 0.5), 0 -13px 5px -10px rgba(255, 255, 255, 0.4) inset',
        'line-height: 40px',
        'text-align: center',
        'font-weight: bold',
        'font-size: 20px',
        'border-radius: 5px',
        'padding: 10px 20px'
    ].join(';');

    const infoStyles = [
        'color: #2c7be5',
        'font-size: 14px',
        'padding: 10px 0',
        'line-height: 1.5',
        'font-family: monospace'
    ].join(';');

    console.log('%c👋 Olá, Desenvolvedor!', styles);
    console.log(
        '%cCurioso para ver como isso funciona?\n' +
        'Este sistema foi desenvolvido por Mateus Teixeira.\n' +
        'Tecnologias: Node.js, Express, Vercel, Neon Postgres.\n\n' +
        'Entre em contato: https://instagram.com/theuska._',
        infoStyles
    );
})();
