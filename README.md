# Letheus

App de gestão financeira pessoal construído com Next.js 15, shadcn/ui e MongoDB.

## Features

- **Dashboard** com 7 KPIs e tabela de despesas por categoria
- **CRUD completo** para despesas, receitas, metas, patrimônio e categorias
- **Importação** de despesas via CSV (débito/crédito) e texto colado do app bancário
- **Classificação automática** de despesas com IA (Gemini 2.5 Flash)
- **Gráficos anuais** de despesas vs metas e evolução patrimonial
- **Assistente financeiro IA** com streaming, cache e rate limit
- **Autenticação** com NextAuth v5 (compatível com Devise/Rails)
- **Sistema de períodos** (meses) com criação automática de metas e receitas

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS 4 |
| Database | MongoDB (Mongoose 8) |
| Auth | NextAuth.js v5 |
| IA | Vercel AI SDK v6 + Gemini |
| Gráficos | Recharts 3 |
| Testes | Vitest 4 + Playwright |

## Setup

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# Rodar em desenvolvimento
npm run dev

# Rodar testes
npm run test
npm run test:e2e
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `MONGODB_URI` | Connection string do MongoDB Atlas |
| `GEMINI_API_KEY` | API key do Google Gemini |
| `NEXTAUTH_SECRET` | Secret para JWT (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL base da aplicação |
