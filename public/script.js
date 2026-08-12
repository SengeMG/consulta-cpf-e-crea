document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ----- CONFIGURAÇÃO SEGURA -----
    const config = window.APP_CONFIG || {};
    const CREA_API_ENDPOINT = config.endpoints?.crea || '/api/consulta-crea';
    const CNPJ_API_ENDPOINT = config.endpoints?.cnpj || '/api/consulta-cnpj';
    const CEP_API_ENDPOINT = config.endpoints?.cep || '/api/consulta-cep';

    // Modo de consulta atual (cpf, cnpj ou cep)
    let currentMode = 'cpf';

    // ----- UI refs -----
    const $ = id => document.getElementById(id);
    const inputCpf = $('cpf'), btnCheck = $('check'), banner = $('banner');
    const documentValidation = $('documentValidation');
    const sourceSel = $('source'), resultsGrid = $('resultsGrid'), toast = $('toast');
    const outCpf = $('outCpf'), outNome = $('outNome'), outGenero = $('outGenero');
    const outNascimento = $('outNascimento'), outSituacao = $('outSituacao'), outTitulo = $('outTitulo');
    const modeToggle = $('modeToggle');
    const cpfFields = $('cpfFields');
    const cnpjFields = $('cnpjFields');
    const modal = $('modal');
    const statusIndicator = $('statusIndicator');
    const themeToggle = $('themeToggle');
    const themeIcon = themeToggle?.querySelector('.theme-icon');

    let consultationInProgress = false;

    // Estados do sistema
    let systemStatus = {
        state: 'connecting', // connecting, online, offline
        message: 'Conectando...',
        type: 'checking'
    };

    function setSystemStatus(state, message) {
        systemStatus = { state, message, type: state === 'connecting' ? 'checking' : state === 'online' ? 'default' : 'error' };
        updateStatusDisplay();
    }

    function updateStatusDisplay() {
        if (!statusIndicator) return;

        const statusText = statusIndicator.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = systemStatus.message;
        }

        // Remove todas as classes de status
        statusIndicator.classList.remove('checking', 'success', 'error');

        // Adiciona classe baseada no estado
        if (systemStatus.type !== 'default') {
            statusIndicator.classList.add(systemStatus.type);
        }
    }

    function checkSystemHealth() {
        // Simplificado: apenas verifica se o endpoint de status responde
        fetch('/api/status')
            .then(response => {
                if (response.ok) {
                    setSystemStatus('online', 'Sistema Online');
                } else {
                    setSystemStatus('offline', 'Sistema Offline');
                }
            })
            .catch(() => {
                setSystemStatus('offline', 'Sistema Offline');
            });
    }

    // Função para verificação inicial do sistema
    async function initializeSystemStatus() {
        setSystemStatus('connecting', 'Conectando...');

        // Verifica status após um delay inicial
        setTimeout(() => {
            checkSystemHealth();
        }, 2000);

        // Verifica status periodicamente a cada 30 segundos
        // Verifica status periodicamente a cada 30 segundos
        setInterval(checkSystemHealth, 30000);

    }

    // Função legada mantida para compatibilidade
    function updateStatus(text, type = 'default') {
        // Para consultas específicas, apenas atualiza temporariamente sem afetar status do sistema
        // O status do sistema continua sendo gerenciado pelo sistema de saúde
        updateStatusDisplay();
    }

    // ----- SISTEMA DE TEMAS -----
    function initTheme() {
        // Carrega tema salvo do localStorage
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
        }

        // Salva no localStorage
        localStorage.setItem('theme', theme);

        // Atualiza title do botão
        if (themeToggle) {
            themeToggle.title = theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro';
        }
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);

        // Animação simples de feedback
        if (themeToggle) {
            themeToggle.style.transform = 'scale(0.8)';
            setTimeout(() => {
                themeToggle.style.transform = '';
            }, 150);
        }
    }

    // ----- Helpers Completos -----
    // Funções para formatação e validação de CPF/CNPJ
    const cleanCpf = (v) => String(v || '').replace(/[^0-9]/g, '');

    const fmtCpf = (v) => {
        const d = String(v || '').replace(/[^0-9]/g, '');
        if (d.length <= 3) return d;
        if (d.length <= 6) return d.slice(0, 3) + '.' + d.slice(3);
        if (d.length <= 9) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
        return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9, 11);
    };

    const cleanCnpj = (v) => String(v || '').replace(/[^0-9]/g, '');

    const fmtCnpj = (v) => {
        const d = String(v || '').replace(/[^0-9]/g, '');
        if (d.length <= 2) return d;
        if (d.length <= 5) return d.slice(0, 2) + '.' + d.slice(2);
        if (d.length <= 8) return d.slice(0, 2) + '.' + d.slice(2, 5) + '.' + d.slice(5);
        if (d.length <= 12) return d.slice(0, 2) + '.' + d.slice(2, 5) + '.' + d.slice(5, 8) + '/' + d.slice(8, 12);
        return d.slice(0, 2) + '.' + d.slice(2, 5) + '.' + d.slice(5, 8) + '/' + d.slice(8, 12) + '-' + d.slice(12, 14);
    };

    const validaCNPJ = (cnpj) => {
        cnpj = String(cnpj || '').replace(/[^0-9]/g, '');

        if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

        let tamanho = cnpj.length - 2;
        let numeros = cnpj.substring(0, tamanho);
        const digitos = cnpj.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;

        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }

        let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        if (resultado !== parseInt(digitos.charAt(0))) return false;

        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;

        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }

        resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        return resultado === parseInt(digitos.charAt(1));
    };
    const validaCPF = (cpf) => {
        cpf = String(cpf || '').replace(/[^0-9]/g, '');
        if (!cpf || cpf.length !== 11 || cpf.split('').every(d => d === cpf[0])) {
            return false;
        }
        const nums = cpf.split('').map(n => parseInt(n, 10));
        function calc(slice) {
            let sum = slice.reduce((acc, digit, index) => acc + digit * (slice.length + 1 - index), 0);
            const res = (sum * 10) % 11;
            return (res === 10) ? 0 : res;
        }
        const d1 = calc(nums.slice(0, 9));
        const d2 = calc(nums.slice(0, 10));
        return d1 === nums[9] && d2 === nums[10];
    };

    function setDocumentValidation(state, message = '') {
        inputCpf.classList.remove('input-invalid', 'input-valid');
        documentValidation.className = 'document-validation';
        documentValidation.textContent = message;

        if (state) {
            documentValidation.classList.add(state);
        }

        inputCpf.setAttribute('aria-invalid', state === 'error' ? 'true' : 'false');
        if (state === 'error') inputCpf.classList.add('input-invalid');
        if (state === 'success') inputCpf.classList.add('input-valid');
    }

    function updateDocumentValidation() {
        if (currentMode !== 'cpf' && currentMode !== 'cnpj') {
            setDocumentValidation();
            btnCheck.disabled = consultationInProgress;
            return true;
        }

        const digits = inputCpf.value.replace(/\D/g, '');
        const isCpf = currentMode === 'cpf';
        const label = isCpf ? 'CPF' : 'CNPJ';
        const expectedLength = isCpf ? 11 : 14;
        const isValid = digits.length === expectedLength && (isCpf ? validaCPF(digits) : validaCNPJ(digits));

        if (!digits) {
            setDocumentValidation('neutral', `Digite um ${label} para consultar.`);
            btnCheck.disabled = true;
            return false;
        }

        if (digits.length < expectedLength) {
            setDocumentValidation('neutral', `Digite os ${expectedLength} dígitos do ${label}.`);
            btnCheck.disabled = true;
            return false;
        }

        if (!isValid) {
            setDocumentValidation('error', `Este ${label} não bate matematicamente. Confira os números.`);
            btnCheck.disabled = true;
            return false;
        }

        setDocumentValidation('success', `${label} válido.`);
        btnCheck.disabled = consultationInProgress;
        return true;
    }

    // Funções para formatação e validação de CEP
    const cleanCep = (v) => String(v || '').replace(/[^0-9]/g, '').padStart(8, '0');

    const fmtCep = (v) => {
        const d = String(v || '').replace(/[^0-9]/g, '');
        if (d.length <= 5) return d;
        return d.slice(0, 5) + '-' + d.slice(5, 8);
    };

    const validaCEP = (cep) => {
        cep = String(cep || '').replace(/[^0-9]/g, '');
        return cep.length === 8 && !/^(\d)\1{7}$/.test(cep);
    };

    // ----- UI Feedback e Controle -----
    const showBanner = (type, message) => { banner.style.display = 'block'; banner.className = 'banner ' + type; banner.textContent = message; }
    const hideBanner = () => banner.style.display = 'none';

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }

    // ----- FUNÇÕES DO MODAL CREA -----
    // URL externa oficial do CREA-MG
    const CREA_EXTERNAL_URL = 'https://crea-mg.sitac.com.br/app/view/sight/externo?form=PesquisarProfissionalEmpresa';

    function showCreaUnavailableModal() {
        // Tenta abrir em nova aba (desktop)
        const newWindow = window.open(CREA_EXTERNAL_URL, '_blank');
        
        // Se bloqueado (mobile/popup blocker), redireciona na mesma aba
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Fallback: redireciona na mesma aba
            window.location.href = CREA_EXTERNAL_URL;
        } else {
            showToast('Abrindo site oficial do CREA-MG...');
            
            // Retorna o select para CPF
            sourceSel.value = 'api';
            currentMode = 'cpf';
            inputCpf.placeholder = 'Digite o CPF';
            inputCpf.maxLength = 14;
            toggleFields('api');
        }
    }

    function hideModal() {
        modal.classList.remove('show');
    }

    // Variável para controlar se deve mostrar dados imediatamente ou aguardar
    let pendingUpdates = [];
    let updateTimeout = null;

    // Função para atualizar campos com delay agrupado
    function queueFieldUpdate(element, newText) {
        pendingUpdates.push({ element, newText });

        if (updateTimeout) clearTimeout(updateTimeout);

        updateTimeout = setTimeout(() => {
            showPendingUpdates();
        }, 500); // Espera 500ms para agrupar todas as atualizações
    }

    async function showPendingUpdates() {
        if (pendingUpdates.length === 0) return;

        // Fade out todos os campos com skeleton
        pendingUpdates.forEach(({ element }) => {
            element.style.opacity = '0.3';
        });

        await new Promise(resolve => setTimeout(resolve, 200));

        // Atualiza todos os campos simultaneamente
        pendingUpdates.forEach(({ element, newText }) => {
            if (element && newText && newText.trim() !== '') {
                element.classList.remove('skeleton');
                element.textContent = newText;
                element.classList.add('success-flash');
            }
        });

        // Fade in todos os campos
        pendingUpdates.forEach(({ element }) => {
            element.style.opacity = '1';
        });

        // Remove flash após 1 segundo
        setTimeout(() => {
            pendingUpdates.forEach(({ element }) => {
                element.classList.remove('success-flash');
            });
        }, 1000);

        pendingUpdates = [];
    }

    function toggleFields(source) {
        // Esconde todos os campos específicos primeiro
        document.querySelectorAll('.crea-field, .cnpj-field, .cep-field').forEach(f => f.style.display = 'none');
        document.getElementById('field-genero').style.display = 'none';
        document.getElementById('field-nascimento').style.display = 'none';
        document.getElementById('field-idade').style.display = 'none';

        // Mostra/esconde campos básicos CPF/CNPJ
        const basicFields = document.querySelectorAll('.field:not(.crea-field):not(.cnpj-field):not(.cep-field):not(#field-genero):not(#field-nascimento):not(#field-idade)');

        if (currentMode === 'cpf') {
            // Modo CPF: mostra campos baseados na fonte selecionada
            basicFields.forEach(f => f.style.display = 'block');
            document.querySelectorAll('.crea-field').forEach(f => f.style.display = source === 'crea' ? 'block' : 'none');
            document.getElementById('field-genero').style.display = source === 'api' ? 'block' : 'none';
            document.getElementById('field-nascimento').style.display = source === 'api' ? 'block' : 'none';
            document.getElementById('field-idade').style.display = source === 'api' ? 'block' : 'none';
            sourceSel.style.display = 'block';
        } else if (currentMode === 'cnpj') {
            // Modo CNPJ: mostra apenas campos de CNPJ
            basicFields.forEach(f => f.style.display = 'block');
            document.querySelectorAll('.cnpj-field').forEach(f => f.style.display = 'block');
            sourceSel.style.display = 'block';
        } else if (currentMode === 'cep') {
            // Modo CEP: esconde campos básicos CPF/CNPJ e mostra apenas campos de CEP
            basicFields.forEach(f => f.style.display = 'none');
            document.querySelectorAll('.cep-field').forEach(f => f.style.display = 'block');
            sourceSel.style.display = 'block';
        }
    }

    function clearResults() {
        // Remove skeleton classes
        document.querySelectorAll('.value').forEach(el => {
            el.classList.remove('skeleton');
            el.textContent = '—';
        });

        // Remove visual de dados encontrados
        resultsGrid.classList.remove('has-data');
    }

    function showLoadingSkeleton() {
        // Esconde todos os campos primeiro
        document.querySelectorAll('.field').forEach(f => f.style.display = 'none');

        if (currentMode === 'cpf') {
            const source = sourceSel.value;
            // Mostra campos baseados na fonte para CPF
            document.querySelectorAll('.crea-field').forEach(f => f.style.display = source === 'crea' ? 'block' : 'none');
            document.getElementById('field-genero').style.display = source === 'api' ? 'block' : 'none';
            document.getElementById('field-nascimento').style.display = source === 'api' ? 'block' : 'none';
            document.getElementById('field-idade').style.display = source === 'api' ? 'block' : 'none';

            // Mostra campos básicos sempre
            document.querySelectorAll('.field:not(.crea-field):not(.cnpj-field):not(.cep-field):not(#field-genero):not(#field-nascimento):not(#field-idade)').forEach(f => {
                f.style.display = 'block';
            });
        } else if (currentMode === 'cnpj') {
            // Mostra campos de CNPJ
            document.querySelectorAll('.cnpj-field').forEach(f => f.style.display = 'block');

            // Mostra campos básicos sempre
            // Mostra campos básicos sempre
            document.querySelectorAll('.field:not(.crea-field):not(.cnpj-field):not(.cep-field):not(#field-genero):not(#field-nascimento):not(#field-idade)').forEach(f => {
                f.style.display = 'block';
            });
        } else if (currentMode === 'cep') {
            // Mostra apenas campos de CEP
            document.querySelectorAll('.cep-field').forEach(f => f.style.display = 'block');
        }

        // Adiciona skeleton animation aos campos visíveis
        setTimeout(() => {
            document.querySelectorAll('.field[style*="block"] .value').forEach(el => {
                el.classList.add('skeleton');
                el.textContent = '';
            });
        }, 100);
    }

    // Alterna entre modos de consulta (CPF/CNPJ)
    function toggleMode() {
        currentMode = currentMode === 'cpf' ? 'cnpj' : 'cpf';
        inputCpf.placeholder = currentMode === 'cpf' ? 'Digite o CPF' : 'Digite o CNPJ';
        inputCpf.maxLength = currentMode === 'cpf' ? '14' : '18';
        inputCpf.value = '';

        // Obtém a referência ao botão de alternância
        const modeToggle = document.getElementById('modeToggle');
        if (modeToggle) {
            modeToggle.textContent = currentMode === 'cpf' ? 'Consultar CNPJ' : 'Consultar CPF';
        }

        // Mostra/esconde o select de fonte baseado no modo
        if (currentMode === 'cnpj') {
            // Modo CNPJ: esconde o select de fonte (CNPJ só tem uma fonte)
            sourceSel.style.display = 'none';
            sourceSel.value = 'cnpj';
        } else {
            // Modo CPF: mostra o select de fonte
            sourceSel.style.display = 'block';
            sourceSel.disabled = false;
            sourceSel.value = 'api';
        }

        // Atualiza os campos exibidos
        toggleFields(sourceSel.value);
        clearResults();
    }

    // ----- Lógica Principal de Consulta -----
    async function handleConsulta() {
        hideBanner();

        const inputValue = inputCpf.value.replace(/[\D]/g, '');

        if (currentMode === 'cpf') {
            const cleaned = cleanCpf(inputValue);
            if (!updateDocumentValidation()) return;
            await consultaCPF(cleaned, sourceSel.value);
        } else if (currentMode === 'cnpj') {
            const cleaned = cleanCnpj(inputValue);
            if (!updateDocumentValidation()) return;
            await consultaCNPJ(cleaned);
        } else if (currentMode === 'cep') {
            const cleaned = cleanCep(inputValue);
            if (!validaCEP(cleaned)) {
                showBanner('error', 'CEP inválido (deve ter 8 dígitos)');
                return;
            }
            await consultaCEP(cleaned);
        }
    }

    // Função para consulta de CPF
    async function consultaCPF(cleaned, source) {
        consultationInProgress = true;
        btnCheck.disabled = true;
        btnCheck.classList.add('loading');
        btnCheck.textContent = 'Consultando...';

        // Mostra campos com skeleton loading
        showLoadingSkeleton();

        // Status do sistema não é alterado durante consultas específicas

        // Anima os campos sendo preenchidos
        toggleFields(source);
        clearResults();

        // Simula um delay mínimo para melhor UX
        await new Promise(resolve => setTimeout(resolve, 300));

        let promise = source === 'crea'
            ? fetch(`${CREA_API_ENDPOINT}?cpf=${cleaned}`)
            : fetch(`/api/consulta-externa?cpf=${encodeURIComponent(cleaned)}`);

        try {
            const rawResponse = await promise;
            const data = await rawResponse.json();
            
            console.log(`[DEBUG] Resposta da fonte '${source}':`, data);

            if (!rawResponse.ok) { throw data; }

            let responseData = data;
            if (source === 'api' && data.data) {
                responseData = data.data;
            }

            // Atualiza todos os campos de uma vez após skeleton
            queueFieldUpdate(outCpf, fmtCpf(cleaned));
            queueFieldUpdate(outNome, responseData.nome ? String(responseData.nome).normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase() : 'NÃO ENCONTRADO');

            if (source === 'api') {
                queueFieldUpdate(outGenero, responseData.genero === 'M' ? 'MASCULINO' : (responseData.genero === 'F' ? 'FEMININO' : 'Não informado'));

                // Formata Data de Nascimento e Calcula Idade
                let dataNascFormatted = 'Não informado';
                let idadeCalculada = '—';

                if (responseData.data_nascimento) {
                    // Tenta detectar o formato da data vinda da API
                    // Assumindo que pode vir como YYYY-MM-DD ou DD/MM/YYYY
                    let parts = [];
                    let dateObj = null;

                    if (responseData.data_nascimento.includes('-')) {
                        // YYYY-MM-DD
                        parts = responseData.data_nascimento.split('-');
                        if (parts.length === 3) {
                            dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
                        }
                    } else if (responseData.data_nascimento.includes('/')) {
                        // DD/MM/YYYY
                        parts = responseData.data_nascimento.split('/');
                        if (parts.length === 3) {
                            // Se for DD/MM/YYYY transforma para Date(YYYY, MM-1, DD)
                            dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
                        }
                    }

                    if (dateObj && !isNaN(dateObj)) {
                        // Formata para DD/MM/YYYY brasileiro
                        const dia = String(dateObj.getDate()).padStart(2, '0');
                        const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const ano = dateObj.getFullYear();
                        dataNascFormatted = `${dia}/${mes}/${ano}`;

                        // Calcula idade
                        const hoje = new Date();
                        let idade = hoje.getFullYear() - dateObj.getFullYear();
                        const m = hoje.getMonth() - dateObj.getMonth();
                        if (m < 0 || (m === 0 && hoje.getDate() < dateObj.getDate())) {
                            idade--;
                        }
                        idadeCalculada = String(idade);
                    } else {
                        // Fallback se não conseguir parsear mas tiver algum valor
                        dataNascFormatted = responseData.data_nascimento;
                    }
                }

                queueFieldUpdate(outNascimento, dataNascFormatted);
                queueFieldUpdate(document.getElementById('outIdade'), idadeCalculada);

            } else {
                queueFieldUpdate(outSituacao, responseData.situacao || 'Não informado');
                queueFieldUpdate(outTitulo, responseData.titulo || 'Não informado');
            }

            // Feedback visual de sucesso
            showToast('✅ Dados encontrados e preenchidos!');

            // Adiciona visual de dados encontrados
            resultsGrid.classList.add('has-data');

        } catch (err) {
            console.error(`[DEBUG] Falha na consulta da fonte '${source}':`, err);
            const errorMessage = err.details || err.message || err.error || 'Erro desconhecido na consulta.';
            showBanner('error', errorMessage);
            outCpf.textContent = fmtCpf(cleaned);
            outNome.textContent = 'FALHA NA CONSULTA';
        } finally {
            consultationInProgress = false;
            btnCheck.classList.remove('loading');
            btnCheck.textContent = 'Consultar';
            updateDocumentValidation();
        }
    }

    // Função para consulta de CNPJ
    async function consultaCNPJ(cleaned) {
        consultationInProgress = true;
        btnCheck.disabled = true;
        btnCheck.classList.add('loading');
        btnCheck.textContent = 'Consultando...';

        // Mostra campos com skeleton loading
        showLoadingSkeleton();

        // Status do sistema não é alterado durante consultas específicas

        toggleFields('cnpj');
        clearResults();

        // Delay para melhor UX
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            const response = await fetch(`${CNPJ_API_ENDPOINT}?cnpj=${cleaned}`);
            const data = await response.json();

            console.log('[DEBUG] Resposta da API de CNPJ:', data);

            if (!response.ok) {
                throw data;
            }

            // Atualiza todos os campos com os dados da empresa
            queueFieldUpdate(outCpf, data.cnpj || '—');
            queueFieldUpdate(outNome, data.nome ? data.nome.toUpperCase() : 'NÃO ENCONTRADO');

            // Preenche os campos específicos de CNPJ
            if (data.nomeFantasia) {
                queueFieldUpdate(document.getElementById('outNomeFantasia'), data.nomeFantasia);
            }
            if (data.endereco) {
                const endereco = [];
                if (data.endereco.logradouro) endereco.push(data.endereco.logradouro);
                if (data.endereco.numero) endereco.push(data.endereco.numero);
                if (data.endereco.complemento) endereco.push(data.endereco.complemento);
                queueFieldUpdate(document.getElementById('outEndereco'), endereco.join(', ') || '—');

                queueFieldUpdate(document.getElementById('outBairro'), data.endereco.bairro || '—');
                queueFieldUpdate(document.getElementById('outCidade'), data.endereco.municipio || '—');
                queueFieldUpdate(document.getElementById('outUF'), data.endereco.uf || '—');
                queueFieldUpdate(document.getElementById('outCEP'), data.endereco.cep || '—');
            }
            if (data.cnaePrincipal) {
                queueFieldUpdate(document.getElementById('outAtividade'),
                    `${data.cnaePrincipal.codigo} - ${data.cnaePrincipal.descricao}` || '—');
            }
            if (data.situacao) {
                queueFieldUpdate(document.getElementById('outSituacaoCNPJ'), data.situacao);
            }
            if (data.abertura) {
                queueFieldUpdate(document.getElementById('outAbertura'), data.abertura);
            }
            if (data.contato) {
                queueFieldUpdate(document.getElementById('outTelefone'), data.contato.telefone || '—');
                queueFieldUpdate(document.getElementById('outEmail'), data.contato.email || '—');
            }

            showToast('✅ Dados da empresa encontrados!');

            // Adiciona visual de dados encontrados
            resultsGrid.classList.add('has-data');

        } catch (err) {
            console.error('[DEBUG] Falha na consulta de CNPJ:', err);
            const errorMessage = err.details || err.message || err.error || 'Erro desconhecido na consulta de CNPJ.';
            showBanner('error', errorMessage);
            outCpf.textContent = fmtCnpj(cleaned);
            outNome.textContent = 'FALHA NA CONSULTA';
        } finally {
            consultationInProgress = false;
            btnCheck.classList.remove('loading');
            btnCheck.textContent = 'Consultar';
            updateDocumentValidation();
        }
    }

    // Função para consulta de CEP
    async function consultaCEP(cleaned) {
        consultationInProgress = true;
        btnCheck.disabled = true;
        btnCheck.classList.add('loading');
        btnCheck.textContent = 'Consultando...';

        // Mostra campos com skeleton loading
        showLoadingSkeleton();

        toggleFields('cep');
        clearResults();

        // Delay para melhor UX
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            const response = await fetch(`${CEP_API_ENDPOINT}?cep=${cleaned}`);
            const data = await response.json();

            console.log('[DEBUG] Resposta da API de CEP:', data);

            if (!response.ok || !data.success) {
                throw data;
            }

            const cepData = data.data;

            // Atualiza todos os campos com os dados do CEP
            queueFieldUpdate(document.getElementById('outCepResultado'), cepData.cep || '—');
            queueFieldUpdate(document.getElementById('outLogradouro'), cepData.logradouro || 'Não informado');
            queueFieldUpdate(document.getElementById('outBairroCep'), cepData.bairro || 'Não informado');
            queueFieldUpdate(document.getElementById('outCidadeCep'), cepData.localidade || '—');
            queueFieldUpdate(document.getElementById('outUfCep'), cepData.uf || '—');
            queueFieldUpdate(document.getElementById('outDdd'), cepData.ddd ? `(${cepData.ddd})` : '—');
            queueFieldUpdate(document.getElementById('outIbge'), cepData.ibge || '—');

            showToast('✅ Endereço encontrado!');

            // Adiciona visual de dados encontrados
            resultsGrid.classList.add('has-data');

        } catch (err) {
            console.error('[DEBUG] Falha na consulta de CEP:', err);
            const errorMessage = err.error || err.message || 'Erro desconhecido na consulta de CEP.';
            showBanner('error', errorMessage);
            document.getElementById('outCepResultado').textContent = fmtCep(cleaned);
            document.getElementById('outLogradouro').textContent = 'FALHA NA CONSULTA';
        } finally {
            consultationInProgress = false;
            btnCheck.classList.remove('loading');
            btnCheck.textContent = 'Consultar';
            updateDocumentValidation();
        }
    }

    // ----- Event Listeners -----
    btnCheck.addEventListener('click', handleConsulta);
    sourceSel.addEventListener('change', () => {
        const selectedValue = sourceSel.value;

        if (selectedValue === 'crea') {
            showCreaUnavailableModal();
            return;
        }

        // Atualiza o modo atual baseado na seleção
        if (selectedValue === 'api') {
            currentMode = 'cpf';
            inputCpf.placeholder = 'Digite o CPF';
            inputCpf.maxLength = 14;
        } else if (selectedValue === 'cnpj') {
            currentMode = 'cnpj';
            inputCpf.placeholder = 'Digite o CNPJ';
            inputCpf.maxLength = 18;
        } else if (selectedValue === 'cep') {
            currentMode = 'cep';
            inputCpf.placeholder = 'Digite o CEP';
            inputCpf.maxLength = 9;
        }

        inputCpf.value = '';
        clearResults();
        toggleFields(selectedValue);
        updateDocumentValidation();
    });

    // Event listener para fechar modal
    document.getElementById('modalClose').addEventListener('click', hideModal);

    // Event listener para tema
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    inputCpf.addEventListener('input', (e) => {
        if (currentMode === 'cpf') {
            e.target.value = fmtCpf(e.target.value.replace(/\D/g, ''));
        } else if (currentMode === 'cnpj') {
            e.target.value = fmtCnpj(e.target.value.replace(/\D/g, ''));
        } else if (currentMode === 'cep') {
            e.target.value = fmtCep(e.target.value.replace(/\D/g, ''));
        }

        if (currentMode === 'cpf' || currentMode === 'cnpj') {
            hideBanner();
        }
        updateDocumentValidation();
    });

    // Remove o botão de alternância de modo antigo (agora usamos o select)
    // O select agora controla CPF/CNPJ/CEP diretamente

    resultsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('copyable')) {
            const textToCopy = e.target.textContent;
            if (textToCopy && textToCopy !== '—' && textToCopy !== 'Não informado' && textToCopy !== 'N/D') {
                navigator.clipboard.writeText(textToCopy)
                    .then(() => showToast(`"${textToCopy}" copiado!`))
                    .catch(err => console.error('Falha ao copiar:', err));
            }
        }
    });

    // Inicializa a interface corretamente
    toggleFields(sourceSel.value);
    updateDocumentValidation();

    // Garante que o select esteja visível no início (modo CPF)
    sourceSel.style.display = 'block';

    // Inicializa sistema de temas
    initTheme();

    // Inicializa sistema de status
    initializeSystemStatus();
});
