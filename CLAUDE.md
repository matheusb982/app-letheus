# Letheus - App de Gestão Financeira Pessoal

## Sobre o Projeto

Reescrita do SmartFinancial (Rails 7 + MongoDB) para Next.js 15. O banco MongoDB é compartilhado com produção — **a modelagem do banco NÃO pode mudar**.

## Stack

- **Framework**: Next.js 15 (App Router, Server Components, Server Actions)
- **UI**: shadcn/ui (estilo new-york) + Tailwind CSS 4 + Lucide Icons
- **DB**: MongoDB via Mongoose 8 (schemas em `src/lib/db/models/`)
- **Auth**: NextAuth.js v5 (Credentials provider, compatível com bcrypt do Devise/Rails)
- **IA**: Vercel AI SDK v6 + `@ai-sdk/google` (Gemini 2.5 Flash)
- **Validação**: Zod 3
- **Gráficos**: Recharts 3
- **Testes**: Vitest 4 (unit) + Playwright (E2E)
- **CSV**: papaparse

## Estrutura de Diretórios

```
src/
├── app/
│   ├── (auth)/           # Login, Register, Forgot Password (sem sidebar)
│   ├── (dashboard)/      # Todas as páginas autenticadas (com sidebar + header)
│   │   ├── dashboard/    # KPIs + tabela categorias
│   │   ├── purchases/    # CRUD + import CSV/texto + gráfico anual
│   │   ├── revenues/     # CRUD
│   │   ├── goals/        # CRUD
│   │   ├── patrimonies/  # CRUD + gráfico anual
│   │   ├── categories/   # CRUD com subcategorias inline
│   │   └── chat/         # Assistente IA com streaming
│   └── api/
│       ├── auth/         # NextAuth handlers
│       └── chat/         # Streaming endpoint (AI SDK v6)
├── components/
│   ├── ui/               # shadcn (NÃO editar manualmente, usar `npx shadcn add`)
│   ├── layout/           # sidebar, header, period-selector, user-menu
│   ├── dashboard/        # kpi-cards, category-table
│   ├── purchases/        # purchase-form, import-dialog
│   ├── categories/       # categories-client
│   ├── charts/           # annual-line-chart
│   ├── chat/             # chat-client
│   └── shared/           # delete-button, submit-button, subcategory-form, revenue-form, loading
├── lib/
│   ├── auth.ts           # NextAuth config + JWT callbacks
│   ├── auth.config.ts    # Middleware auth config
│   ├── db/
│   │   ├── connection.ts # Mongoose singleton
│   │   └── models/       # 10 models (NÃO alterar schemas — banco em produção)
│   ├── actions/          # Server Actions (CRUD, dashboard, chart, chat, import, period)
│   ├── services/         # Lógica de negócio (csv-import, text-import, ai-classifier, payments-per-category)
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
- **NUNCA alterar schemas dos models** — o banco MongoDB é compartilhado com a app Rails em produção
- Timestamps são snake_case: `created_at`, `updated_at`
- Collections com nomes explícitos: `mongoose.model('User', schema, 'users')`
- Subcategories são embedded documents em Category (subdocuments Mongoose)
- Usar `.lean<Type>()` em queries para tipagem correta
- Sempre chamar `connectDB()` antes de queries

### Auth
- Senhas compatíveis com bcrypt do Devise (Rails): `$2a$` hash
- JWT contém `userId` e `periodId`
- Period é relido do DB em mutations (não confiar no JWT para escrita)
- Middleware protege todas as rotas exceto `/login`, `/register`, `/forgot-password`

### IDs Hardcoded
- Aporte subcategory IDs: `674f65d9e182e26ad80cc636`, `674f65d9e182e26ad80cc635` (definidos em `constants.ts`)
- Receitas default ao criar período: Herospark (R$ 14.500) e Prefeitura (R$ 4.000)

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
- Detecta formato pelo header: "Estabelecimento" = débito, "Valor em R$" = crédito
- Remove BOM, parsing com papaparse (separator `;`)
- Classificação IA via Gemini com fallback para "Outros"
- Dedup por fingerprint: `date|value|description`

### Chat
- Rate limit: 50 perguntas/dia por usuário
- Cache: SHA256(pergunta + data), TTL 3h
- Context: receitas, despesas por subcategoria com %, top 5, saldo
- Detecta mês mencionado na pergunta para trocar período

## Variáveis de Ambiente

```
MONGODB_URI=mongodb+srv://...
GOOGLE_GENERATIVE_AI_API_KEY=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```
