#!/bin/bash

echo "🚀 Iniciando deploy do Anki Pro (Apple / Neon) na VPS..."

# Atualiza repositório e pacotes
git pull origin main || true

# Sincroniza o banco Neon PostgreSQL com Prisma
npx prisma db push

# Build e execução com Docker Compose
docker compose down
docker compose up --build -d

echo "✅ App de Flashcards está ONLINE na sua VPS na porta 3000!"
