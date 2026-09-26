# Alquimia Perfumes Artesanais — Guia para o Kiro

Este arquivo é o ponto de entrada para qualquer sessão do Kiro neste projeto.
Leia isto antes de começar a próxima task. Para o raciocínio arquitetural
completo (decisões de design, por que cada camada existe), ver
`ARCHITECTURE.md`. Para o estado técnico verificável (rotas, comandos, testes),
ver `SPECS.md` — mas note que `SPECS.md` está desatualizado (parou na task 11);
este arquivo é a fonte da verdade sobre progresso.

## O que é este projeto

E-commerce de perfumaria artesanal brasileira ("Alquimia Perfumes Artesanais"),
migrado de um template de moda (Next.js 16, App Router, mock data em inglês/USD)
para um sistema real: PostgreSQL + Prisma, autenticação real, admin funcional,
domínio de disponibilidade/prazo de entrega testado isoladamente.

Plano de execução: **35 tasks**, executadas sequencialmente, cada uma comitada
e verificada (lint + typecheck + testes + build) antes de avançar para a
próxima. Progresso atual: **20 de 35 concluídas e commitadas** (a task 21 tem
trabalho não commitado — ver seção "Em andamento" abaixo).

## Como continuar

1. Rode `git status --short` e `git log --oneline -5` primeiro — confirme o
   que está commitado vs. o que sobrou no working directory de uma sessão
   anterior.
2. Se houver mudanças não commitadas de uma task interrompida, retome-a antes
   de iniciar a próxima (ver "Task 21" abaixo).
3. Depois de qualquer mudança: `npm run lint && npx tsc --noEmit && npm run
   test && npm run build`. Nunca avance para a próxima task com isso vermelho.
4. Depois de terminar e verificar uma task, faça commit (mensagem descritiva,
   arquivos específicos — nunca `git add .`) e `git push origin main`.
5. Sempre criar/limpar scripts de teste manual em `scripts/` — **nunca
   commitar** scripts de verificação temporários ou usuários de teste no
   banco. Apague-os antes do commit.
6. Para testes manuais via Playwright que exigem um admin logado: crie um
   usuário com role `SUPER_ADMIN` via script `scripts/` temporário, teste, e
   **delete o usuário e o script** ao final. Nenhuma credencial de teste deve
   sobreviver entre sessões.

## Convenções que já existem e devem ser seguidas

- **Idioma**: interface em PT-BR. Código/comentários em inglês.
- **Dinheiro**: sempre inteiro em centavos (`Cents` type), nunca float.
- **Camada de serviço**: `src/server/services/<domínio>/` dividido em três
  arquivos — `*-queries.ts` (leitura, sem `"use server"`, chamado direto por
  Server Components), `*-actions.ts` (`"use server"`, escrita, valida com
  Zod, resolve identidade via sessão — nunca confia em id vindo do cliente),
  `*-schema.ts` (Zod compartilhado entre form e action). Domínios existentes:
  `admin/`, `auth/`, `account/`, `cart/`, `catalog/`, `settings/`.
- **Domínio puro**: `src/server/domain/**` não importa Prisma nem React
  (`purity.test.ts` garante isso). Regras de disponibilidade e prazo de
  entrega vivem aqui, testadas sem banco.
- **RBAC**: `requirePermission(key)` em toda Server Action de admin
  (`src/server/services/auth/rbac.ts`). Nunca confiar em esconder item de
  menu como controle de acesso — isso é só apresentação.
- **Auditoria**: toda escrita de admin grava `AuditLog` com o ator real
  (id + label do admin logado), nunca um placeholder.
- **Providers (pagamento/frete/fiscal/mail/storage/queue/cep)**: interface +
  driver escolhido por env var. Driver "fake" é rejeitado em produção
  (`src/server/env.ts`).
- **Branding**: nunca hardcode nome/logo da loja. Sempre `getStoreSettings()`
  (`src/server/services/settings/store-settings.ts`), editável em
  `/admin/settings`.
- **Server Components lendo cookies**: se uma página lê sessão/carrinho via
  cookie, ela precisa de `export const dynamic = "force-dynamic"` a menos que
  já tenha outro motivo para ser dinâmica (evita cache estático servindo dado
  de outro usuário).
- **Cuidado com Client Components importando módulos de servidor**: importar
  uma função de `*-queries.ts` (sem `"use server"`) direto em um Client
  Component quebra o build (Prisma/pg vazando pro bundle do browser). Sempre
  passar por um wrapper `"use server"` em `*-actions.ts` quando o consumidor
  é client-side.

## O que já está pronto (tasks 1-20, commitadas)

| Área | Onde ver | Task |
|---|---|---|
| Schema completo (perfumaria + transacional) | `prisma/schema.prisma`, 53+ tabelas | 5-9 |
| Storefront real (catálogo, filtros, busca) | `/shop`, `/produto/[slug]`, `/categorias/*`, `/search` | 1-11 |
| Domínio de disponibilidade/entrega | `src/server/domain/availability`, `delivery` | 6-13 |
| Admin de produtos + estoque | `/admin/products`, `/admin/inventory` | 14-15 |
| Autenticação real (Argon2id, sessão em tabela) | `src/server/services/auth/`, `src/proxy.ts` | 16 |
| E-mail transacional (fake outbox) | `src/server/providers/mail/` | 17 |
| RBAC (8 papéis, 22 permissões) + MFA (TOTP) + auditoria | `/admin/auditoria`, `src/server/services/auth/rbac.ts` | 18 |
| Configurações da loja + identidade visual real | `/admin/settings`, logo Alquimia aplicado | 19 |
| Perfil e endereços do cliente reais (CPF/CNPJ validado) | `/account/profile`, `/account/addresses` | 20 |

Detalhes de decisões de design de cada task estão nos commits
(`git log --oneline`) — cada mensagem de commit documenta o que foi feito e
por quê, incluindo bugs encontrados e corrigidos durante a verificação.

## Em andamento: Task 21 (carrinho persistido no servidor)

**Não commitado.** Havia trabalho substancial no working directory quando a
sessão foi interrompida, no meio da verificação manual. Antes de continuar:

1. Rode `npm run typecheck && npm run lint && npm run test && npm run build`
   para confirmar se o estado atual ainda está saudável (estava limpo na
   última verificação).
2. Retome a verificação manual: adicionar item ao carrinho como visitante,
   aplicar cupom, atualizar quantidade, logar e confirmar merge do carrinho
   de visitante com o do cliente, limpar carrinho após "finalizar pedido".
3. Depois de verificado, comitar e dar push antes de seguir para a task 22.

O que foi implementado (arquivos novos em `src/server/services/cart/`):

- `cart-identity.ts` — resolve qual `Cart` usar. Visitante: cookie httpOnly
  `guest_cart` com token opaco; cliente logado: um `Cart` por `customerId`
  (a coluna não é `@unique` no schema, então usa `findFirst`+`create`, não
  `upsert`). `mergeGuestCartIntoCustomerCart()` funde os dois no login.
  **Atenção**: existe `resolveCartId()` (cria carrinho + grava cookie — só
  pode ser chamado de Server Action) e `peekCartId()` (só leitura, seguro em
  Server Component). Não confundir os dois — gravar cookie fora de Server
  Action quebra o build com erro do Next.js.
- `cart-queries.ts` — `getCartView()` resolve preço/disponibilidade/cupom
  sempre ao vivo (nunca confia em valor salvo), remove itens de variantes
  apagadas/inativas automaticamente.
- `cart-actions.ts` — `addItem`, `updateItemQuantity`, `removeItem`,
  `applyCoupon`, `removeCoupon`, `clearCart`, `fetchCartView` (wrapper
  `"use server"` para uso em Client Component). Valida disponibilidade antes
  de escrever, mas **não cria `InventoryReservation`** — isso foi
  deliberadamente deixado para o checkout (task 22/23), conforme comentário
  no próprio schema (`inventory-schema.ts`).
- UI reescrita: `cart-view.tsx`, `cart-item.tsx`, `cart-drawer.tsx`,
  `coupon-input.tsx`, `product-detail.tsx` (botão "Adicionar à sacola" agora
  chama a action real, antes era só um `setTimeout` fake).
- `checkout-flow.tsx` recebe o carrinho do servidor como prop, mas a
  finalização do pedido em si **continua mock** (não grava `Order`) — isso é
  escopo da task 22/23.
- Funcionalidade removida (não existe coluna no schema): "salvar para
  depois" no carrinho. Se for reintroduzida, precisa de migration.
- `src/store/cart-store.ts` foi reduzido: só guarda estado de UI da gaveta
  (`isOpen`/`open`/`close`) e a API antiga de `addItem` continua existindo
  **apenas** porque `/compare` (página 100% mock, não migrada) ainda a usa.

## O que falta (tasks 21-35)

Ordem e escopo por comentários encontrados no próprio código
(`grep -rn "task 2[1-9]\|task 3[0-9]"` nos arquivos leva a essas pistas) e
pela tabela de fases do `SPECS.md`:

| Fase | Tasks | O que entrega |
|---|---|---|
| Carrinho e pedidos | **21** (em andamento — ver acima) | Carrinho persistido no servidor |
| | 22 | Histórico de pedidos reais (`/account/orders`, `/account` overview) — hoje usa `useAuthStore` + mock `getOrdersByCustomer`. Reviews vinculadas a pedido verificado (comentário em `reviews-section.tsx`) |
| | 23 | Reserva de estoque (`InventoryReservation`) na finalização do pedido — todo o ciclo SALE/RESERVATION/RELEASE do ledger de inventário, hoje inexistente na aplicação |
| Checkout, pagamento, frete, fiscal | 24 | Endereço real no checkout (hoje formulário US genérico, sem ligação com `CustomerAddress`) |
| | 25-29 | Integrações via interface + driver "fake": pagamento, frete (`CEP_PROVIDER` já validado em env, mas nenhum provider de CEP existe ainda), emissão fiscal |
| Notificações, upload, CMS | 30 | `NotificationService` real (fila, retry, templates editáveis no admin) — hoje só o `MailProvider` fake de verificação/reset existe |
| | 31 | Upload de imagem real (`STORAGE_PROVIDER` já no env, sem driver implementado) |
| | 32 | Home editorial via CMS/admin |
| LGPD e produção | 33 | Consentimentos e políticas de privacidade (`PrivacyConsent`/`PrivacyRequest` já no schema, sem UI) |
| | 34 | Hardening de segurança de produção |
| | 35 | Suíte de testes E2E |

**Isso é uma reconstrução por pistas, não uma lista oficial** — o plano
completo das 35 tasks vive na memória interna de sessões anteriores do Kiro,
não em um arquivo. Se uma sessão nova não tiver esse contexto, a forma mais
confiável de confirmar o escopo exato de uma task é: grep por comentários
`task N` no código (várias tasks futuras já têm `TODO`/comentários apontando
o que falta) e cross-check com o schema Prisma (o que já tem tabela pronta
geralmente indica o que a próxima task vai preencher).

## Dados mock que ainda restam (fora do escopo até a task correspondente)

- `src/lib/data/**` — catálogo de moda do template original. `products.ts`
  ainda é usado por `/compare` e telas de admin (`analytics`, `reviews`)
  ainda não migradas. Não apagar até essas telas serem migradas.
- `src/store/auth-store.ts`, `profile-store.ts` (parcial), `order-store.ts` —
  ainda alimentam `/account` overview, `/account/orders`,
  `/account/payment-methods`. Serão substituídos na task 22.
- `/admin/analytics`, `/admin/reviews`, `/admin/discounts`,
  `/admin/customers`, `/admin/orders` — painéis admin ainda mock, sem tasks
  específicas identificadas no roadmap reconstruído acima (provavelmente
  distribuídos entre as tasks 22-24 conforme o domínio correspondente ganha
  dados reais).
