#!/bin/bash
# Script para configurar rapidamente o projeto Filesfy

echo "🚀 Inicializando Filesfy..."

# 1. Criar diretórios se não existirem
echo "📁 Verificando estrutura de diretórios..."
mkdir -p backend/config backend/routes backend/controllers backend/models backend/migrations

# 2. Instalar dependências
echo "📦 Instalando dependências npm..."
npm install

# 3. Criar arquivo .env se não existir
if [ ! -f .env ]; then
  echo "🔐 Criando arquivo .env..."
  cp .env.example .env
  echo "⚠️  Abra .env e preencha as credenciais do Google e PostgreSQL"
fi

# 4. Informar sobre PostgreSQL
echo ""
echo "========================================="
echo "📊 PRÓXIMO PASSO: Configurar PostgreSQL"
echo "========================================="
echo ""
echo "1. Abra pgAdmin 4 ou use psql"
echo ""
echo "2. Crie um banco de dados:"
echo "   CREATE DATABASE filesfy_db;"
echo ""
echo "3. Execute o script SQL:"
echo "   psql filesfy_db < backend/migrations/001_create_tables.sql"
echo ""
echo "4. Ou use pgAdmin:"
echo "   - Clique no banco 'filesfy_db'"
echo "   - Tools → Query Tool"
echo "   - Cole o conteúdo de 001_create_tables.sql"
echo "   - Execute"
echo ""
echo "========================================="
echo "🔑 PRÓXIMO: Configurar Google OAuth"
echo "========================================="
echo ""
echo "1. Acesse: https://console.cloud.google.com"
echo "2. Crie um projeto"
echo "3. Ative: Google+ API"
echo "4. Credenciais → OAuth 2.0 ID do Cliente Web"
echo "5. URIs autorizados:"
echo "   - http://localhost:3000"
echo "   - http://localhost:3001"
echo "6. Copie Client ID e Secret para .env"
echo "7. Atualize index.html com Client ID"
echo ""
echo "========================================="
echo "▶️ RODAR O PROJETO"
echo "========================================="
echo ""
echo "npm run dev"
echo ""
echo "✅ Tudo pronto!"
