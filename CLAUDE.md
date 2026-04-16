# Letheus - App de Gestão Financeira Pessoal

## Sobre o Projeto

Reescrita do SmartFinancial (Rails 7 + MongoDB) para Next.js 15. Multi-tenant por família — cada família tem seus dados isolados (períodos, despesas, receitas, metas, patrimônio, categorias). O app Rails foi desativado.

## Stack

- **Framework**: Next.js 15 (App Router, Server Components, Server Actions)
- **UI**: shadcn/ui (estilo new-york) + Tailwind CSS 4 + Lucide Icons
- **DB**: MongoDB via Mongoose 8 (schemas em `src/lib/db/models/`)
- **Auth**: NextAuth.js v5 (Credentials provider, compatível com bcrypt do Devise/Rails)
- **IA**: Vercel AI SDK v6 + `@ai-sdk/openai` (GPT-4o, principal) + `@ai-sdk/google` (Gemini 2.5 Flash, fallback)
- **Validação**: Zod 3
- **Gráficos**: Recharts 3
- **Testes**: Vitest 4 (unit) + Playwright (E2E)
- **Email**: Resend (emails transacionais)
- **Cron**: Vercel Cron Jobs (aviso de trial)
- **CSV**: papaparse

## Estrutura de Diretórios

```
src/
├── app/
│   ├── (auth)/           # Login, Register, Forgot Password, Reset Password (sem sidebar)
│   ├── (dashboard)/      # Todas as páginas autenticadas (com sidebar + header)
│   │   ├── dashboard/    # KPIs + tabela categorias
│   │   ├── purchases/    # CRUD + import CSV/texto + gráfico anual
│   │   ├── revenues/     # CRUD
│   │   ├── goals/        # CRUD
│   │   ├── patrimonies/  # CRUD + gráfico anual
│   │   ├── categories/   # CRUD com subcategorias inline
│   │   ├── chat/         # Assistente IA com streaming
│   │   ├── family/       # Gestão da família pelo owner (membros, exclusão)
│   │   └── admin/        # Gestão de usuários e famílias (super admin)
│   ├── onboarding/       # Wizard de onboarding (5 etapas)
│   └── api/
│       ├── auth/         # NextAuth handlers
│       ├── chat/         # Streaming endpoint (AI SDK v6)
│       └── cron/         # Vercel Cron Jobs (trial-expiring)
├── components/
│   ├── ui/               # shadcn (NÃO editar manualmente, usar `npx shadcn add`)
│   ├── layout/           # sidebar, header, period-selector, user-menu
│   ├── dashboard/        # kpi-cards, category-table
│   ├── purchases/        # purchase-form, import-dialog
│   ├── categories/       # categories-client
│   ├── charts/           # annual-line-chart
│   ├── chat/             # chat-client
│   ├── admin/            # admin-families-client, admin-family-members-client, admin-users-client
│   ├── family/           # family-management-client (gestão de membros + exclusão)
│   ├── onboarding/       # onboarding-wizard (wizard multi-step)
│   └── shared/           # delete-button, submit-button, subcategory-form, revenue-form, loading
├── lib/
│   ├── auth.ts           # NextAuth config + JWT callbacks
│   ├── auth.config.ts    # Middleware auth config
│   ├── db/
│   │   ├── connection.ts # Mongoose singleton
│   │   └── models/       # 13 models (inclui Family, AuditLog)
│   ├── actions/          # Server Actions (CRUD, dashboard, chart, chat, import, period, family, onboarding)
│   ├── services/         # Lógica de negócio (csv-import, text-import, ai-classifier, ai-provider, payments-per-category, email-service)
│   ├── validations/      # Zod schemas por entidade
│   └── utils/            # format, months, constants, cn
├── hooks/
└── middleware.ts          # Proteção de rotas
tests/
├── unit/                  # Vitest (format, months, validations, payments-per-category)
└── e2e/                   # Playwright (auth, navigation)
```

## Comandos

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Build de produção
npm run test         # Vitest (unit tests)
npm run test:watch   # Vitest em modo watch
npm run test:e2e     # Playwright E2E
npm run lint         # ESLint
```

## Regras Importantes

### Banco de Dados
- Timestamps são snake_case: `created_at`, `updated_at`
- Collections com nomes explícitos: `mongoose.model('User', schema, 'users')`
- Subcategories são embedded documents em Category (subdocuments Mongoose)
- Usar `.lean<Type>()` em queries para tipagem correta
- Sempre chamar `connectDB()` antes de queries

### Multi-Tenancy (Família)
- Model `Family` representa um tenant — cada família é uma plataforma isolada
- Todos os dados financeiros (Period, Purchase, Revenue, Goal, Patrimony, Category) têm `family_id`
- Toda query DEVE filtrar por `family_id` — usar `getUserFamilyContext()` ou `getUserFamilyId()` de `family-helpers.ts`
- JWT contém `familyId` (além de `userId` e `periodId`)
- Categorias com `family_id: null` são templates globais, clonados ao criar nova família
- Self-registration habilitado via landing page (`/register`)
- No registro: cria família automaticamente ("Família {nome}"), clona categorias globais, redireciona ao onboarding
- Super admin (`ADMIN_EMAIL`) pode criar famílias e membros via `/admin/families`
- Family owner gerencia membros via `/family` (limite de 3 membros)
- Owner pode editar nome da família, adicionar/remover membros
- Exclusão de conta: membro é anonimizado (LGPD), owner deve remover membros ou excluir família primeiro
- Exclusão de família: deleta todos os dados financeiros, membros e a família (irreversível)
- AuditLog registra todas as ações de gestão de membros
- Scripts: `npx tsx scripts/migrate-family.ts`, `npx tsx scripts/seed-global-categories.ts`

### Auth
- Senhas compatíveis com bcrypt do Devise (Rails): `$2a$` hash
- JWT contém `userId`, `periodId` e `familyId`
- Period é relido do DB em mutations (não confiar no JWT para escrita)
- Middleware protege todas as rotas exceto `/login`, `/register`, `/forgot-password`, `/reset-password`

### Email (Resend)
- `email-service.ts` centraliza todos os envios via Resend
- **Recuperação de senha**: token SHA256 com 256 bits, hasheado no DB, expira em 1h, uso único
- Anti-enumeração: forgot-password retorna sucesso mesmo se email não existe
- Rate limit: 3 req/15min no forgot, 5 req/15min no reset
- Sanitização XSS nos templates (escapeHtml no userName)
- **Aviso de trial**: cron diário às 12h UTC envia email para owner quando faltam 3 dias e 1 dia
- Cron protegido por `CRON_SECRET` (Bearer token) — response não expõe dados sensíveis

### IDs Hardcoded
- Aporte subcategory IDs: `674f65d9e182e26ad80cc636`, `674f65d9e182e26ad80cc635` (definidos em `constants.ts`)
- Fallback: busca por nome "APORTE" quando IDs não são encontrados (novos usuários)
- Receitas default ao criar período: Herospark (R$ 14.500) e Prefeitura (R$ 4.000)

### Onboarding
- 5 etapas: Boas-vindas → Receita → Importação → Processamento → Resumo
- Cria período, receitas e despesas automaticamente
- Suporta: CSV, texto colado, dados de exemplo
- Dados de exemplo marcados com `is_sample: true` — deletados automaticamente na primeira importação real ou criação manual
- `onboarding_completed` no User controla se mostra o wizard
- Usuários existentes (com `family_id`) pulam o onboarding

### Sugestão de Metas (IA)
- Precisa de pelo menos 2 períodos com dados pra sugerir metas
- Gastos fixos (variação ≤15%) protegidos do cap de 80% da receita
- Gastos com média > meta (estourados) também protegidos do cap
- Total sugerido nunca ultrapassa 80% da receita — só reduz variáveis

### AI SDK v6 (Breaking Changes)
- Import hooks de `@ai-sdk/react` (não `ai/react`)
- `useChat` usa `TextStreamChatTransport` para configurar `api` e `body`
- `sendMessage({ text: "..." })` (não `prompt`)
- `status === "streaming"` (não `isLoading`)
- `toTextStreamResponse()` (não `toDataStreamResponse()`)
- `maxOutputTokens` (não `maxTokens`)
- Mensagens usam `parts` com `{ type: "text", text: "..." }`

### Padrões de Código
- Server Actions em `src/lib/actions/` com `"use server"` no topo
- Validação Zod antes de mutations
- `revalidatePath()` após mutations
- Componentes client com `"use client"` no topo
- shadcn estilo `new-york` (Radix, com `asChild`)
- Não usar `any` — tipar tudo (ESLint bloqueia)

### CSV Import
- Detecta formato pelo header para escolher o parser (não o tipo de compra)
- Tipo de compra (débito/crédito) escolhido pelo usuário
- Remove BOM, parsing com papaparse (separator `;`)
- Classificação IA via GPT-4o com fallback para Gemini, depois "Outros"
- Dedup por fingerprint: `date|value|description`

### IA — Fallback entre Provedores
- `ai-provider.ts` abstrai OpenAI e Gemini com `generateTextWithFallback()` e `streamTextWithFallback()`
- Classificação de despesas: GPT-4o (principal) → Gemini (fallback)
- Sugestão de metas: GPT-4o (principal) → Gemini (fallback)
- Chat streaming: GPT-4o (principal) → Gemini (fallback)
- Se o provedor principal falha (erro de API, saldo, timeout), tenta o fallback automaticamente

### Chat
- Rate limit: 50 perguntas/dia por usuário
- Cache: SHA256(pergunta + data), TTL 3h
- Context: receitas, despesas por subcategoria com %, top 5, saldo
- Detecta mês mencionado na pergunta para trocar período

## Variáveis de Ambiente

### Produção
```
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@letheus.com.br
CRON_SECRET=...
```

### Ambiente Local (desenvolvimento)
```
MONGODB_URI=mongodb://localhost:27018/letheus
OPENAI_API_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
NEXTAUTH_SECRET=dev-secret-key-for-local-testing-only
NEXTAUTH_URL=http://localhost:3001
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@letheus.com.br
CRON_SECRET=dev-cron-secret
```

> MongoDB local roda na porta **27018** via Docker (`docker-compose.yml`)
