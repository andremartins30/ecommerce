# Perfumaria BR — E-commerce

E-commerce de perfumaria brasileira em produção, evoluído a partir do
template Nebula (Next.js, mock data, moda). Catálogo real em
PostgreSQL/Prisma, regras de disponibilidade (pronta entrega vs. sob
encomenda) e prazo de entrega como domínio testado isoladamente, storefront
já ligado ao banco.

Estado atual do projeto, tarefas concluídas e pendentes, e rotas para ver o
catálogo real funcionando: veja [`SPECS.md`](./SPECS.md).
Decisões de arquitetura e raciocínio de design: veja [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** (strict)
- **PostgreSQL** + **Prisma 7** (driver adapter, client gerado em `src/server/db/generated`)
- **Tailwind CSS v4** + **shadcn/ui** sobre **Base UI**
- **Zustand** para estado de cliente (carrinho, wishlist, UI), persistido em `localStorage`
- **React Hook Form + Zod** para validação de formulário
- **Vitest** (unit/component/integration) + **Playwright** (E2E)

## Getting started

```bash
npm install
npm run db:up       # sobe Postgres + Redis via Docker
npx prisma migrate deploy
npx tsx prisma/seed.ts   # catálogo demonstrativo idempotente
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Navegue por `/shop`,
`/produto/[slug]` e `/categorias/[slug]` para ver o catálogo real (ver
`SPECS.md` para a lista completa de rotas migradas).

Variáveis de ambiente: copie `.env.example` para `.env.local` e ajuste. Em
desenvolvimento local, Postgres/Redis rodam em portas não-padrão
(55432/16379) para não colidir com instâncias já existentes na máquina.

## Scripts

```bash
npm run dev              # servidor de desenvolvimento
npm run build             # build de produção (type-checks toda a aplicação)
npm run lint               # ESLint
npm run typecheck          # tsc --noEmit
npm test                   # suíte completa (unit + component + integration)
npm run test:unit           # regras de negócio puras (src/server/domain/**)
npm run test:integration    # testes contra o banco de dados real
npm run test:e2e             # Playwright
npm run db:up / db:down      # sobe/derruba Postgres + Redis (Docker)
npm run db:studio            # Prisma Studio
npm run db:migrate           # nova migration em desenvolvimento
npm run db:deploy            # aplica migrations pendentes
```

## Estrutura

```
src/
├── app/                 # rotas, agrupadas por (site) / (auth) / (checkout) / admin
├── components/           # primitivas de UI e pastas de feature (product, cart, checkout, account, admin, home, layout, shop)
├── hooks/                 # use-product-filters, use-variant-selection, use-products-by-ids, use-hydrated
├── lib/                    # tipos compartilhados, formatação pt-BR/BRL, pricing, tipos legados (mock, em migração)
├── server/
│   ├── domain/              # regras de negócio puras — disponibilidade, prazo de entrega, dinheiro (sem I/O, ver purity.test.ts)
│   ├── services/catalog/     # queries e mappers que ligam o domínio ao Postgres
│   ├── db/                    # client Prisma singleton + client gerado
│   └── env.ts                  # validação de ambiente com Zod (rejeita drivers "fake" em produção)
└── store/                  # stores zustand (carrinho, wishlist, UI — áreas ainda não migradas para o servidor)
prisma/
├── schema.prisma          # schema completo (catálogo + transacional)
├── seed.ts / seed-data.ts  # seed idempotente de demonstração
└── migrations/
```

O catálogo (produtos, variantes, categorias, famílias olfativas) já vem do
banco. Área de conta, checkout e admin ainda usam dados mock/localStorage em
`src/lib/data` enquanto suas respectivas migrações não são concluídas — ver
o roteiro em `SPECS.md`.
