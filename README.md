# Letheus — IA Financeira

App de gestão financeira pessoal com IA, construído com Next.js 15, shadcn/ui e MongoDB. Multi-tenant por família.

## Features

- **Dashboard** com 7 KPIs e tabela de despesas por categoria
- **CRUD completo** para despesas, receitas, metas, patrimônio e categorias
- **Importação** de despesas via CSV (débito/crédito) e texto colado do app bancário
- **Classificação automática** de despesas com IA (GPT-4o, fallback Gemini)
- **Sugestão de metas** com IA — protege gastos fixos, só reduz variáveis
- **Gráficos anuais** de despesas vs metas e evolução patrimonial
- **Assistente financeiro IA** com streaming, cache e rate limit
- **Onboarding** em 5 etapas com dados de exemplo (`is_sample`)
- **Self-registration** com criação automática de família e categorias
- **Autenticação** com NextAuth v5 (compatível com Devise/Rails)
- **Multi-tenancy** por família — dados isolados por tenant
- **Gestão de família** — owner pode adicionar/remover membros (limite 3)
- **Exclusão de conta/família** com anonimização (LGPD)
- **Audit log** de todas as ações de gestão de membros
- **Fallback automático entre provedores de IA** (OpenAI ↔ Gemini)

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router, Server Components) |
| UI | shadcn/ui (new-york) + Tailwind CSS 4 + Lucide Icons |
| Database | MongoDB (Mongoose 8) |
| Auth | NextAuth.js v5 |
| IA | Vercel AI SDK v6 + OpenAI GPT-4o + Gemini 2.5 Flash |
| Validação | Zod 3 |
| Gráficos | Recharts 3 |
| Testes | Vitest 4 + Playwright |

## Setup

```bash
# Instalar dependências
npm install

# Subir MongoDB local
docker compose up -d

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# Seed de categorias globais (necessário para novos usuários)
npx tsx scripts/seed-global-categories.ts

# Rodar em desenvolvimento
npm run dev

# Rodar testes
npm run test
npm run test:e2e
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `MONGODB_URI` | Connection string do MongoDB |
| `OPENAI_API_KEY` | API key da OpenAI (GPT-4o — provedor principal) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | API key do Google Gemini (fallback) |
| `NEXTAUTH_SECRET` | Secret para JWT (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL base da aplicação |

### Ambiente Local

```
MONGODB_URI=mongodb://localhost:27018/letheus
NEXTAUTH_URL=http://localhost:3001
```

> MongoDB local roda na porta **27018** via Docker (`docker-compose.yml`)
