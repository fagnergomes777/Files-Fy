# 🚀 Filesfy - Recuperação de Arquivos com Planos FREE/PRO

Uma aplicação de desktop desenvolvida em **Electron** com recuperação de arquivos, autenticação via Google OAuth e sistema de pagamento integrado.

## 🌟 Funcionalidades

### ✅ Planos Disponíveis
- **FREE** - Grátis para sempre
  - Até 3 varridas por mês
  - Limite 100MB por varredura
  - Máximo 5 arquivos
  - Suporte por email
  
- **PRO** - R\$ 9,99/mês (37% de desconto no primeiro mês)
  - Varreduras ilimitadas
  - Sem limite de arquivos
  - Armazenamento 50GB
  - Suporte prioritário

### 🔐 Autenticação
- Login com Google OAuth 2.0
- JWT com sessão persistente
- Logout seguro

### 💳 Pagamento
- Integração com Stripe (pronto para uso)
- Suporte a PIX, Cartão de Crédito e Débito

### 📁 Recuperação
- Seleção de dispositivo
- Filtro por tipo de arquivo
- Preview de arquivos encontrados
- Recuperação em lote

---

## 🛠️ Instalação Rápida

### 1️⃣ Requisitos
- Node.js 16+
- PostgreSQL (opcional, para dados reais)
- Git

### 2️⃣ Clone e Instale
\\\ash
git clone <seu-repositorio>
cd Files-Fy
npm install
\\\

### 3️⃣ Configure as Variáveis
Crie um arquivo `.env` na raiz:
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=filesfy_db
DB_USER=postgres
DB_PASSWORD=your_password

# Stripe
STRIPE_SECRET_KEY=your_stripe_key

# JWT
JWT_SECRET=your_jwt_secret
```

**⚠️ IMPORTANTE - Google OAuth:**
Se você estiver tendo erro ao autenticar com Google:
1. Vá para [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto
3. Ative a API "Google+ API"
4. Crie credenciais OAuth 2.0 do tipo "Aplicação da Web"
5. Adicione `http://localhost:3001/auth/google/callback` aos URIs autorizados
6. Copie o Client ID e Secret para o arquivo `.env`

📖 **Instruções completas**: Veja [CONFIGURACAO_GOOGLE_OAUTH.md](./CONFIGURACAO_GOOGLE_OAUTH.md)

### 4️⃣ Inicie a Aplicação
\\\ash
npm run dev
\\\

---

## 📁 Estrutura do Projeto

\\\
Files-Fy/
├── electron/
│   ├── main.js          # Janela Electron
│   └── preload.js       # Segurança
├── src/
│   ├── index.html       # HTML principal
│   ├── renderer.js      # Lógica da aplicação
│   ├── styles.css       # Estilos (cards Norton/AVG style)
│   ├── auth.js          # Gerenciador de autenticação
│   └── api.js           # Cliente HTTP
├── backend/
│   ├── server.js        # Express server (porta 3001)
│   ├── config/
│   │   └── database.js  # Pool PostgreSQL
│   ├── models/          # User, Subscription, etc
│   ├── controllers/     # Auth, Payment, Subscription
│   └── routes/          # API endpoints
└── package.json
\\\

---

## 🎮 Como Usar

### Tela Inicial
1. **Escolha o Plano**
   - FREE: Comece grátis
   - PRO: Faça upgrade (redireciona para Google OAuth)

2. **Recuperar Arquivos**
   - Selecione o disco
   - Escolha o tipo de arquivo
   - Aguarde a varredura
   - Selecione arquivos
   - Escolha local de salvamento

### Planos Filtrados
- Clique em **FREE** ou **PRO** para filtrar e ver apenas esse plano
- Veja as funcionalidades de cada um

---

## 🔌 API Backend

### Endpoints Principais

\\\
POST   /api/auth/login-google       # Login com Google
POST   /api/auth/verify             # Verificar token
POST   /api/auth/logout             # Logout

GET    /api/subscriptions/:userId   # Ver plano do usuário
POST   /api/subscriptions/upgrade    # Fazer upgrade para PRO
POST   /api/subscriptions/downgrade  # Voltar para FREE

POST   /api/payments/intent          # Criar pagamento
POST   /api/payments/webhook         # Webhook Stripe
GET    /api/payments/history         # Histórico de pagamentos
\\\

---

## 🔑 Configurações Importantes

### Google OAuth
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto
3. Ative **Google+ API**
4. Crie credencial **OAuth 2.0 Web Application**
5. Adicione URIs autorizadas:
   - http://localhost:3000 (Electron)
   - http://localhost:3001 (Backend)

### Stripe
1. Crie conta em [Stripe](https://stripe.com)
2. Pegue sua **Secret Key**
3. Adicione em \.env\

### PostgreSQL
\\\ash
# Criar banco de dados
createdb filesfy_db

# Executar migrations
psql filesfy_db < backend/migrations/001_create_tables.sql
\\\

---

## 🎨 Interface

- **Dark Theme**: Tons de azul (#0f172a, #1e293b)
- **Botões**: Verde neon (#22c55e)
- **Cards**: Estilo Norton/AVG com checkmarks (✓) e crosses (✗)
- **Responsivo**: Mobile, Tablet, Desktop

---

## 🚀 Scripts Disponíveis

\\\ash
npm run dev              # Inicia Electron + Backend
npm run server:dev       # Apenas servidor
npm run electron:dev     # Apenas Electron
npm install              # Instalar dependências
\\\

---

## ⚙️ Tecnologias

- **Desktop**: Electron v40.0.0
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Express.js v4.18.2
- **Database**: PostgreSQL
- **Auth**: Google OAuth 2.0, JWT
- **Pagamento**: Stripe v14.0.0
- **Criptografia**: bcryptjs, jsonwebtoken

---

## 📝 Notas

### Modo Teste
Sem configurar Google OAuth e Stripe, você ainda pode:
- ✅ Usar plano FREE completo
- ✅ Ver interface PRO
- ✅ Testar fluxo de UI

### Para Produção
1. Configure credenciais reais (Google, Stripe)
2. Use PostgreSQL cloud (AWS RDS, Heroku, etc)
3. Implemente HTTPS
4. Configure variáveis de ambiente

---

## 🐛 Troubleshooting

### npm start falha
\\\ash
rm -rf node_modules package-lock.json
npm install
\\\

### Electron não abre
- Verifique se backend rodou na porta 3001
- Tente: \
pm run dev\ novamente

### Banco de dados não conecta
\\\ash
# Verificar se PostgreSQL está rodando
psql -U postgres

# Criar database
createdb filesfy_db
\\\

---

## 📧 Suporte

Para dúvidas ou bugs, abra uma issue no repositório.

---

## 📄 Licença

MIT License - Veja LICENSE.md para detalhes

---

**Desenvolvido com ❤️ usando Electron e Express**
