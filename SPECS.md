# Especificação do Projeto — Perfumaria BR

Documento de referência rápida. Para o raciocínio arquitetural completo, ver
`ARCHITECTURE.md`. Este arquivo responde duas perguntas: **o que existe hoje**
e **onde ver cada coisa**.

Estado geral: 10 de 35 tarefas concluídas. Banco de dados, regras de negócio e
o **storefront público já estão ligados ao catálogo real de perfumaria no
Postgres** — não é mais o template de moda com dados mock. Área de conta,
checkout e painel admin ainda rodam sobre dados mock/localStorage; são
migrados nas tarefas 14–24.

---

## 1. O que já está pronto e verificável agora

### 1.1 Banco de dados

PostgreSQL rodando via Docker, schema completo de perfumaria + módulo
transacional (53 tabelas, 64 constraints, seed de 9 produtos demonstrativos).

```bash
npm run db:up       # sobe Postgres + Redis (se não estiverem no ar)
npm run db:studio    # abre Prisma Studio no navegador — visualização direta das tabelas
```

### 1.2 Storefront público — agora com dados reais

Este é a principal mudança desde a última versão deste documento: as páginas
públicas do site pararam de usar os arquivos mock de moda em `src/lib/data/`
e passaram a consultar o Postgres diretamente através de
`src/server/services/catalog/queries.ts`.

```bash
npm run dev
```
Abre em **http://localhost:3000**.

**Rotas para conferir o catálogo real:**

| Rota | O que você vê |
|---|---|
| `/` | Home com categorias e produtos vindos do banco (Imperium, Solaris, Veludo Negro, Âmbar Sacro, etc.) |
| `/shop` | Catálogo completo, com paginação e ordenação (destaque/novidade/preço/mais vendido/melhor avaliado) contra o banco |
| `/produto/imperium` (ou qualquer slug real do seed) | Página de produto com preço em R$, volumes disponíveis, disponibilidade e avaliações reais |
| `/categorias` | Lista de categorias reais (Contratipos, Importados, Nicho, Outros) |
| `/categorias/contratipos` | Produtos filtrados por categoria real |
| `/search?q=amadeirado` | Busca textual contra nome/marca/SKU/notas/família olfativa no banco |
| `/wishlist` | Lista de desejos (IDs guardados no navegador, resolvidos contra o catálogo real via `/api/products/by-ids`) |

Confirmado por teste manual (curl contra o servidor rodando): as quatro
primeiras rotas da tabela retornam preços reais em R$ (ex.: "R$ 149,90" para
Imperium 30ml), não mais os produtos de moda em dólar do template original.

Note que as rotas de produto e categoria mudaram de inglês para português:
`/product/[slug]` → `/produto/[slug]`, `/categories/[slug]` →
`/categorias/[slug]`.

### 1.3 O que NÃO foi migrado ainda (ainda mock/localStorage)

- `/login`, `/register`, `/forgot-password` — autenticação simulada, sem senha
  real (Task 16)
- `/cart`, `/checkout` — carrinho e checkout ainda client-side (Tasks 21, 22, 25)
- `/account/**` — pedidos, endereços, perfil ainda mock, exceto a lista de
  produtos recomendados na home da conta, que já usa dados reais (Task 20/22)
- `/admin/**` — painel inteiro ainda mock e **sem autenticação nenhuma**
  (⚠️ qualquer pessoa que acesse a URL entra; corrigido nas tarefas 16–18)
- A busca rápida no cabeçalho (dropdown do ícone de lupa) ainda filtra a lista
  mock local; a busca da página `/search` já é real. Unificação vem na Task 11.

### 1.4 Regras de negócio (domínio)

Lógica de disponibilidade, prazo de produção e promessa de entrega, testada
isoladamente sem precisar de banco ou navegador:

```bash
npm run test:unit
```

Arquivos-chave:
- `src/server/domain/availability/availability.ts` — regra "estoque zero ≠ indisponível"
- `src/server/domain/delivery/delivery-promise.ts` — produção e transporte nunca somados num único número
- `src/server/domain/pricing/money.ts` — dinheiro em centavos
- `src/server/services/catalog/queries.ts` / `mappers.ts` — consultas reais ao catálogo e conversão para os DTOs da tela

### 1.5 Testes automatizados

```bash
npm test                   # tudo (unit + component + integration)
npm run test:unit           # regras de negócio puras
npm run test:integration    # contra o banco de dados real
npm run build               # build de produção do Next.js
npm run lint
npx tsc --noEmit
```

Estado atual: **255 testes passando** (14 arquivos), lint com 0 erros (12
avisos pré-existentes, não relacionados a esta migração), build de produção
gerando as rotas dinâmicas esperadas (`/shop`, `/produto/[slug]`,
`/categorias/[slug]`, `/search`, `/api/products/by-ids`), 0 vulnerabilidades
de dependência.

---

## 2. Roteiro restante (visão rápida)

| Fase | O que entrega |
|---|---|
| Filtros e busca de perfumaria (Task 11) | Facetas reais (família, concentração, volume, disponibilidade) e busca unificada |
| Página de produto avançada (Task 12–13) | Pirâmide olfativa, disclaimer de contratipo, carrinho misto com prazos |
| Admin de produtos (Task 14–15) | Cadastro de perfumes/variantes pelo painel, com permissão, auditoria e estoque real |
| Autenticação real (Task 16–18) | Login com senha verdadeira (Argon2id + TOTP), `/admin` protegido, RBAC |
| Clientes, carrinho e pedidos (Task 19–24) | Dados de conta, carrinho e pedido persistidos no banco, com prazo de produção exibido |
| Checkout, pagamento, frete, fiscal (Task 25–29) | Integrações via interfaces + implementação "fake" para desenvolvimento |
| Notificações, upload, CMS (Task 30–32) | E-mails transacionais, imagens, home editorial |
| LGPD e hardening (Task 33–35) | Consentimentos, políticas, segurança de produção, suíte E2E |

Lista completa das 35 tarefas: acompanhada internamente pela ferramenta de
task list da sessão — posso listar o detalhe de qualquer fase se for útil.

---

## 3. Onde ver o que já foi alterado

- **Storefront real**: `npm run dev` → http://localhost:3000 → navegue pelas
  rotas da tabela na seção 1.2.
- **Banco de dados**: `npm run db:studio` (visual) ou `psql` direto no container.
- **Serviços de catálogo**: `src/server/services/catalog/queries.ts` e `mappers.ts`.
- **Regras de negócio**: arquivos em `src/server/domain/**` — a maioria tem
  comentários explicando a decisão de design junto ao código.
- **Schema completo**: `prisma/schema.prisma`.
- **Histórico de decisões e arquitetura**: `ARCHITECTURE.md`.
- **Variáveis de ambiente**: `.env.local` (Postgres/Redis locais nas portas
  55432/16379, escolhidas porque as portas padrão 5432/6379 já estavam em uso
  na sua máquina).

---

## 4. Observação pendente

Este workspace **não é um repositório git** (`git status` falha). Sem
controle de versão não há como desfazer uma mudança das próximas 25 tarefas
além do histórico interno de edições do editor. Vale decidir se inicializamos
um repositório antes de continuar.
