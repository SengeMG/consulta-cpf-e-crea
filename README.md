# 🚀 Sistema de Consulta CPF/CNPJ - SENGE-MG

<div align="center">
  <img src="public/favicon.png" width="100" alt="Logo SENGE-MG">
  
  <h3>🔍 Sistema profissional de consulta de CPF e CNPJ com interface moderna e recursos avançados</h3>
  <p><strong>Desenvolvido por:</strong> <a href="https://instagram.com/theuska._">Mateus Teixeira</a></p>
  
  <p>
    <a href="#funcionalidades">📋 Funcionalidades</a> • 
    <a href="#tecnologias">⚡ Tecnologias</a> • 
    <a href="#deployment">🚀 Deploy</a> • 
    <a href="#temas">🎨 Temas</a> • 
    <a href="#ux-features">✨ UX</a> • 
    <a href="#suporte">💬 Suporte</a>
  </p>
  
  ![Status](https://img.shields.io/badge/Status-Produção%20Ready-success.svg)
  ![Temas](https://img.shields.io/badge/Temas-Claro%20%7C%20Escuro-blue.svg)
  ![Segurança](https://img.shields.io/badge/Segurança-Avançada-green.svg)
  ![Mobile](https://img.shields.io/badge/Mobile-Responsivo-orange.svg)
  ![UX](https://img.shields.io/badge/UX-Moderna-purple.svg)
</div>

---

## 🎯 **Funcionalidades**

### 🔍 **Consultas Disponíveis**
- ✅ **CPF via API Externa** - Consulta completa de dados pessoais
- ✅ **CNPJ via Receita WS** - Dados completos de empresas
- ⚠️ **CREA-MG** - Modal elegante informando indisponibilidade temporária

### 🎨 **Interface Moderna e Temas**
- 🎭 **Sistema Dual Theme** - Clara e Escura com switch flutuante
- 🌟 **Design Glassmorphism** - Visual moderno e profissional
- 📱 **Mobile-First** - Responsivo e otimizado para celulares
- 🔄 **Transições Suaves** - Animações elegantes em toda interface
- 🪟 **Modal Inteligente** - Para funcionalidades temporariamente indisponíveis
- 💡 **Status em Tempo Real** - Indicador visual das operações

### ✨ **UX/UI Avançada**
- 🎭 **Skeleton Loading** - Animação elegante durante carregamento
- 📊 **Batch Updates** - Informações aparecem todas juntas após skeleton
- 🔔 **Toast Notifications** - Feedback imediato das ações
- 💫 **Success Flash** - Animação verde de confirmação nos campos
- 📋 **Select Inteligente** - Aparece/desaparece baseado no modo (CPF/CNPJ)
- 🎯 **Copyable Fields** - Clique para copiar qualquer informação

### 🖱️ **Sistema de Status Inteligente**
- 🟡 **Conectando** - Estado inicial testando APIs automaticamente
- 🟢 **Sistema Online** - Todas APIs funcionando, verificação a cada 30s
- 🔴 **Sistema Offline** - Problemas detectados automaticamente
- 🔄 **Não muda em consultas** - Status permanente apenas para falhas reais

### 📊 **Feedback Visual Avançado**
- 🟢 **Status Dot** - Verde (Online) / Amarelo (Conectando) / Vermelho (Offline)
- ✅ **Validação em Tempo Real** - CPF e CNPJ são validados matematicamente durante a digitação
- ✨ **Auto-preenchimento Animado** - Campos preenchem com efeito elegante
- 🔔 **Toast Notifications** - Feedback imediato das ações
- 📋 **Progress Indicators** - Estados de carregamento visuais

### 🛡️ **Segurança Avançada**
- 🔒 **Rate Limiting** - Proteção server-side para consultas de CPF
- ✅ **Validação Rigorosa** - CPF/CNPJ validados antes do processamento
- 📡 **Headers Seguros** - Helmet.js para proteção contra ataques comuns
- 🌐 **CORS Restrito** - Apenas domínios autorizados
- 🧹 **Sanitização** - Entrada automática de dados perigosos
- 📝 **Logs Detalhados** - Monitoramento de segurança em tempo real

### 💾 **Persistência e Configuração**
- ⚙️ **Variáveis de Ambiente** - Configuração centralizada e segura
- 💿 **localStorage** - Preferências de tema salvas automaticamente
- 🔧 **Sistema Modular** - Código organizado e escalável
- 📦 **APIs Internas** - Chamadas externas abstraídas para segurança

---

## ⚡ **Tecnologias**

<detail>
<summary>🔧 Stack Principal Completo</summary>

**Backend:**
- Node.js (ES Modules)
- Express.js com middlewares avançados
- dotenv (configuração segura)
- helmet (segurança HTTP)
- express-rate-limit (limitação inteligente)
- express-validator (validação robusta)
- cors (controle de origem)

**Frontend:**
- HTML5 Semântico com acessibilidade
- CSS3 Moderno (Grid/Flexbox/Glassmorphism)
- JavaScript ES6+ (Vanilla)
- Dual Theme System com localStorage
- CSS Custom Properties avançadas
- RequestAnimationFrame otimizado

**APIs Externas:**
- Receita WS (CNPJ - gratuito)
- APICPF.com (CPF - API Key)
- CREA-MG (futuramente - web scraping)

**Build & Deploy:**
- Vercel (serverless functions)
- GitHub Actions (CI/CD automático)
- Environment Variables configuráveis

**Funcionalidades Especiais:**
- Skeleton Loading animations
- Batch data updates
- Health check automático
- Rate limiting server-side
- Copy functionality
- Toast notifications
- Status indicators
- Theme persistence

</details>

---

## 🚀 **Deploy no Vercel**

### **📋 Pré-requisitos**
```bash
# Clone o repositório
git clone <seu-repo>
cd sistema-consulta-cpf-cnpj

# Instalar dependências
npm install
```

### **⚙️ Configuração**

**1. Copiar arquivo de ambiente:**
```bash
cp .env.example .env
```

**2. Configurar variáveis no Vercel:**
```bash
# Variáveis obrigatórias
SECRET_KEY=sua-chave-secreta-forte-super-longa
CPF_API_KEY=sua-chave-apicpf
CPF_API_BASE_URL=https://apicpf.com/api/consulta
CNPJ_API_BASE_URL=https://receitaws.com.br/v1/cnpj

# Configurações opcionais
API_RATE_LIMIT_MAX_REQUESTS=15
API_RATE_LIMIT_WINDOW_MS=60000
CORS_ALLOWED_ORIGINS=https://seusite.com,https://www.seusite.com
NODE_ENV=production
```

### **🌐 Deploy Automático**

1. **Conectar ao GitHub:**
   - Faça fork ou conecte seu repositório
   - Acesse [vercel.com](https://vercel.com)
   - Import o projeto do GitHub

2. **Configurar Environment Variables:**
   ```
   Vercel Dashboard → Project Settings → Environment Variables
   ```

3. **Deploy:**
   ```
   Push das mudanças → Automatic Deploy ✅
   ```

### **📱 URLs de Acesso**
- **Produção:** `https://seuprojeto.vercel.app`
- **Preview:** `https://seuprojeto-git-branch.vercel.app`

---

## 🎨 **Sistema de Temas**

### 🌙 **Tema Escuro (Padrão)**
- Background: Azul escuro profundo (#0f172a)
- Cards: Vidro escuro translúcido
- Texto: Branco suave (#e6eef8)
- Botões: Azul profissional (#0b5ed7 → #2c7be5)
- Contraste: Alto para legibilidade noturna

### ☀️ **Tema Claro**
- Background: Cinza claro suave (#f8f9fa)
- Cards: Branco sólido (#ffffff)
- Texto: Preto suave (#212121)
- Botões: Azul profissional (#0b5ed7 → #2c7be5)
- Contraste: Ótimo para uso diurno

### 🔄 **Funcionalidades do Tema**
- 💾 **Persistência** - Escolha salva no localStorage
- 🪟 **Switch Flutuante** - Botão circular no canto superior direito
- ⚡ **Transições Suaves** - Mudança instantânea sem flash
- 🎭 **Ícones Dinâmicos** - 🌙/☀️ muda conforme tema atual

---

## ✨ **Recursos UX/UI Únicos**

### 🎭 **Skeleton Loading System**
```javascript
// Durante consulta todas os campos relevantes aparecem
// com animação skeleton elegante por ~500ms
// Depois TODAS as informações aparecem juntas de uma vez
// com animação de flash verde de confirmação
```

### 📊 **Sistema de Status Inteligente**
```javascript
// Estados permanentes que não mudam durante consultas:
🟡 "Conectando..."   → 2s testando APIs
🟢 "Sistema Online"  → Todas APIs OK (verificação 30s)
🔴 "Sistema Offline" → Problemas detectados
```

### 💫 **Batch Data Updates**
- ⚡ Delay de 500ms para agrupar updates
- 🎯 Todos os campos atualizam simultaneamente
- ✨ Suave fade out → update → fade in
- 💚 Flash verde de confirmação

### 🎮 **Interatividade Avançada**
- 📋 Click para copiar qualquer campo
- 🔄 Temas alternam com animação 180°
- 📱 Responsivo perfeito mobile-first
- 🎨 Glassmorphism em todos elementos

---

## 💬 **Suporte e Contato**

### **🛠️ Desenvolvido por Mateus Teixeira**

<div align="center">
  
  **📱 Instagram:** [@theuska._](https://instagram.com/theuska._)
  
  **💼 Precisa de sistemas similares? Faça um orçamento!**
  
  *Especialista em desenvolvimento web profissional com UX moderna*

**

---

## 🔧 **Customizações Disponíveis**

- 🛡️ Sistema de autenticação/autorização completo
- 📊 Dashboard administrativo avançado
- 📈 Relatórios e estatísticas em tempo real
- 🔌 APIs customizadas para seu negócio
- 🛒 Sistemas de e-commerce robustos
- 🎨 Landing pages profissionais
- 🌐 Sistemas multi-idioma
- 📱 Apps mobile nativos
- ⚡ Microservices e arquiteturas escaláveis

---

## 📊 **Estatísticas do Projeto**

- **Segurança:** ✅ Rate Limiting + Helmet + CORS + Validação + Sanitização
- **Performance:** ✅ Serverless + Skeleton Loading + Optimizações CSS/JS
- **Responsividade:** ✅ Mobile-first + Touch-friendly + Adaptive layouts
- **UX/UI:** ✅ Glassmorphism + Dual Theme + Batch Updates + Status System
- **Funcionalidades:** ✅ Copy to clipboard + Toast notifications + Health checks
- **Código:** ✅ ES6+ + Modular + Escalável + Type-safe patterns
- **Acessibilidade:** ✅ Semantic HTML + ARIA + Keyboard navigation
- **Monitoramento:** ✅ Security logs + Health checks + Rate limit tracking

---

## ⚖️ **Licença**

Todos os direitos reservados. © 2024 Mateus Teixeira

**Para uso interno da SENGE-MG**

---

## 📸 **Preview do Sistema**

### 🎨 **Interface Dark Theme:**
```
🌙 Sistema Online                    ← Status permanente
┌─────────────────────────────────┐
│ LOGO      SENGE‑MG               │ ← Header com gradiente
│           Consulta CPF/CNPJ      │   azul no logo MG
│ 📋 Select  [🌐API] [Consultar]   │ ← Botões azuis consistentes
├─────────────────────────────────┤
│ ████ ████  (Skeleton Loading)   │ ← Campos skeleton
│ ████ ████                       │   → TODAS aparecem juntas
└─────────────────────────────────┘
Interface interna | @theuska._       ← Instagram link
```

### ☀️ **Interface Light Theme:**  
- Mesma estrutura com cores adaptadas
- Botões mantêm azul profissional
- Skeleton com cores tema claro
- Status permanente independente

### 🎯 **UX Features:**
- 🪟 Botão tema flutuante (canto superior direito)
- 📊 Status indicador permanente (não muda em consultas)
- ⚡ Skeleton → Batch update → Flash confirmação
- 📱 Mobile responsivo com glassmorphism
- 💾 Tema salvo automaticamente

---

<div align="center">
  
  <strong>🚀 Sistema desenvolvido com qualidade profissional e UX de última geraçõo</strong>
  
  <br>
  
  <em>Se precisa de algo, entre em contato!</em>
  
  <br><br>
  
  *Made by Mateus Teixeira ([@theuska._](https://instagram.com/theuska._))*
  
</div>
