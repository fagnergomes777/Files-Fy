# Guia de Configuração - Google OAuth

## Problema
A autenticação com Google está falhando porque o `CLIENT_ID` não está configurado.

## Solução Passo-a-Passo

### 1. Acessar Google Cloud Console
- Vá para [Google Cloud Console](https://console.cloud.google.com)
- Faça login com sua conta Google

### 2. Criar/Selecionar um Projeto
- Se não tiver um projeto, clique em "Criar Projeto"
- Digite um nome (ex: "Filesfy")
- Clique em "Criar"

### 3. Ativar Google+ API
- No menu superior, clique em "APIs e Serviços"
- Clique em "Ativar APIs e Serviços"
- Procure por "Google+ API" ou "Google Identity"
- Clique nela e depois em "Ativar"

### 4. Criar Credenciais OAuth 2.0
- Vá para "APIs e Serviços" > "Credenciais"
- Clique em "+ Criar credenciais"
- Selecione "ID do cliente OAuth 2.0"
- Se for a primeira vez, clique em "Configurar consentimento OAuth"

### 5. Configurar Consentimento (se necessário)
- Tipo de usuário: "Externo"
- Clique em "Criar"
- Preencha:
  - Nome do aplicativo: "Filesfy"
  - Email de suporte: seu_email@gmail.com
  - Clique em "Salvar e continuar"

### 6. Criar ID do Cliente
- Volte para "Credenciais"
- Clique em "+ Criar credenciais" > "ID do cliente OAuth 2.0"
- Tipo de aplicativo: "Aplicação da Web"
- Nome: "Filesfy Desktop"
- **URIs autorizados de redirecionamento:**
  ```
  http://localhost:3001/auth/google/callback
  ```
- Clique em "Criar"

### 7. Copiar Credenciais
- Uma janela aparecerá com seu **Client ID** e **Client Secret**
- Copie os dois valores

### 8. Configurar o Arquivo .env
- Abra o arquivo `.env` na raiz do projeto
- Procure por:
  ```
  GOOGLE_CLIENT_ID=USE_YOUR_GOOGLE_CLIENT_ID_FROM_CONSOLE
  GOOGLE_CLIENT_SECRET=USE_YOUR_GOOGLE_CLIENT_SECRET_FROM_CONSOLE
  ```
- Substitua pelos valores que copiou:
  ```
  GOOGLE_CLIENT_ID=seu_client_id_realmente.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=seu_client_secret_realmente_longo
  ```

### 9. Atualizar index.html
- Abra `src/index.html`
- Procure por:
  ```html
  <meta name="google-client-id" content="USE_YOUR_GOOGLE_CLIENT_ID_FROM_CONSOLE.apps.googleusercontent.com">
  ```
- Substitua pelo seu Client ID:
  ```html
  <meta name="google-client-id" content="seu_client_id_realmente.apps.googleusercontent.com">
  ```

### 10. Reiniciar a Aplicação
```bash
npm run dev
```

## Verificação
- A aplicação deve abrir no Electron
- Você deve ver os cartões de planos
- Clicando em "Assinar com Google" deve funcionar sem erros
- Após autenticar, deve mostrar seu perfil no topo

## Troubleshooting

### Erro: "popup_blocked_by_browser"
- O navegador bloqueou o popup do Google
- Verifique as permissões de popup

### Erro: "invalid_client"
- O CLIENT_ID ou CLIENT_SECRET está incorreto
- Verifique se copiou corretamente do Google Cloud Console

### Erro: "redirect_uri_mismatch"
- O URI de redirecionamento não corresponde
- Verifique no arquivo `.env` e no Google Cloud Console
- Deve ser exatamente: `http://localhost:3001/auth/google/callback`

### Erro: "User cancelled the sign-in"
- O usuário clicou em "Cancelar" na janela do Google
- Tente novamente
