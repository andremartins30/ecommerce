# Arquitetura

Documento vivo. Descreve de onde o projeto partiu, para onde vai, o que é
preservado e o que é substituído. Atualizado ao final de cada fase da migração.

- **Estado atual:** fase 0 concluída (baseline, testes, ambiente de
  desenvolvimento). O storefront ainda roda sobre dados mock em memória.
- **Última atualização:** fase 0.

---

## 1. Visão geral

Loja de perfumaria brasileira. O diferencial de negócio não é o catálogo: é a
**disponibilidade por variante**. Cada volume de cada perfume pode estar em
pronta entrega ou ser produzido sob encomenda, e o prazo de produção
(configurável, padrão 15 dias) é sempre apresentado **separado** do prazo de
transporte. Nenhuma tela soma os dois num número único.

A aplicação é um **monolito Next.js modular**, não uma API separada. Route
Handlers e Server Actions dão transação, validação e autorização no servidor sem
duplicar deploy; o domínio fica isolado em `src/server/**` para poder ser
extraído depois, se houver motivo.

---

## 2. Estado de onde partimos

O repositório era um template de e-commerce de moda com interface madura e
nenhum backend:

| Camada | Como era |
|---|---|
| Fonte de verdade | Arrays mock em `src/lib/data/*` + Zustand persistido em `localStorage` |
| Autenticação | `setTimeout(700)` que injetava `customers[0]`; qualquer senha ≥8 entrava |
| Autorização | Inexistente. `/admin/**` respondia 200 para qualquer visitante |
| Preço e total | Calculados no cliente, em três lugares diferentes, em float de dólar |
| Estoque | Inteiro aleatório por variante, mutável pelo browser, sem decremento |
| Pedido | `setTimeout(1200)` gerando id no cliente e gravando em `localStorage` |
| Pagamento | Máscaras de cartão puramente visuais |
| Testes | Nenhum |

Interface e vocabulário eram de vestuário (tamanhos, cores, materiais), com duas
marcas residuais conflitantes ("NEBULA" e "ARKIVE"), moeda USD e textos em
inglês.

## 3. Estado desejado

```
STOREFRONT + BACKEND + POSTGRESQL + AUTENTICAÇÃO REAL + ADMIN + CATÁLOGO
+ ESTOQUE + PRODUÇÃO SOB ENCOMENDA + CARRINHO + CHECKOUT + PAGAMENTOS
+ PEDIDOS + NOTA FISCAL + FRETE + LOGÍSTICA + E-MAILS + LGPD + SEGURANÇA
+ AUDITORIA + OBSERVABILIDADE
```

---

## 4. Componentes preservados

A interface existente é boa e foi auditada antes de qualquer alteração. Fica:

- As 27 rotas de storefront e 14 de admin, com os grupos `(site)`, `(auth)`,
  `(checkout)` e seus layouts separados.
- **Filtros com a URL como fonte de verdade** (`src/hooks/use-product-filters.ts`):
  `updateParams`, `toggleListValue` e `clearFilters` são mantidos; só as facetas
  mudam de vestuário para perfumaria.
- As 33 primitivas shadcn sobre `@base-ui/react` em `src/components/ui` — note a
  prop `render={<Link/>}`, que é da Base UI e não do Radix.
- A camada compartilhada `src/components/common` (`MetricCard`, `StatusBadge`,
  `Pagination`, `EmptyState`, `PriceDisplay`, `Rating`, `Skeletons`, `Reveal`).
- Galeria de produto, breakdown de estrelas das avaliações, cart drawer,
  `OrderTimeline` (reusada por conta e admin), o stepper de checkout em 4 etapas
  com validação por etapa, e o padrão de lista do admin (busca + filtros +
  paginação + seleção em lote + `AlertDialog`).
- Os tokens oklch e o dark mode em `src/app/globals.css`, incluindo a escala de
  raio, `--ease-premium` e as utilities `.container-page` / `.text-balance`.
- `use-hydrated`, usado para evitar mismatch de hidratação.

## 5. Componentes substituídos

| Substituído | Por |
|---|---|
| `src/lib/data/*` (mocks determinísticos) | PostgreSQL + Prisma + `prisma/seed.ts` |
| `auth-store` com `setTimeout` | Sessão em tabela, Argon2id, cookie HttpOnly, `middleware.ts` |
| Stores `arkive-admin-*` | Server Actions transacionais com RBAC e `AuditLog` |
| `Money = number` em dólares | `Cents` (inteiro) + `Decimal`/`Int` no banco |
| Cálculo de total no componente | Recálculo autoritativo no servidor |
| `stock: number` no produto | `Inventory` (onHand/reserved/available) por variante + movimentações |
| Taxonomia dupla (`cat-apparel` vs `cat-fashion`) | Taxonomia única de perfumaria |
| `sizes: ["30ml"]` / `colors` / `material` | `volumeMl`, família olfativa, notas, concentração |
| Zustand como fonte de verdade | Zustand apenas para estado de UI e carrinho otimista |

---

## 6. Fronteiras internas

```
src/
  app/            rotas; api/ para webhooks, upload e CEP
  components/     UI preservada, adaptada ao domínio
  server/
    env.ts        validação Zod do ambiente no boot
    db/           cliente Prisma, helpers de transação
    domain/       regras puras: sem React, sem Prisma, sem rede
      availability/  resolveAvailability, resolveProductionLeadTime
      delivery/      DeliveryPromiseService
      inventory/     reserve / release / commit
      pricing/       money.ts (centavos), recálculo de carrinho
      production/    lead time, OVERDUE, transições
      order/         máquina de estados
    services/     casos de uso, transacionais
    providers/    Payment | Shipping | Fiscal | Mail | Storage | Queue | Cep
    auth/         sessão, RBAC, MFA
    security/     rate limit, CSRF, sanitização, auditoria
  lib/            schemas Zod compartilhados, formatação pt-BR/BRL, utils
  store/          Zustand: somente UI
```

Regras que não se negociam:

1. Nenhum componente React calcula preço, total, disponibilidade ou prazo. Eles
   recebem valores já resolvidos pelo servidor.
2. `domain/` é puro. É onde vivem os casos de teste obrigatórios do negócio.
3. Toda mutação: valida com Zod → checa permissão → abre transação → grava
   `AuditLog`.
4. Providers são interfaces. O driver real entra por variável de ambiente; o
   driver `fake` existe para desenvolvimento e teste e é **rejeitado no boot**
   quando `NODE_ENV=production` (`src/server/env.ts`).

---

## 7. Banco de dados

PostgreSQL 16 com Prisma. Convenções:

- **Dinheiro é sempre inteiro em centavos** (`priceCents`). Nunca `Float`. O
  código anterior arredondava desconto e imposto para a unidade inteira de
  dólar, o que produzia divergência financeira real.
- Enums nativos do Postgres.
- Invariantes de estoque no banco, não só na aplicação:
  `onHand >= 0`, `reserved >= 0`, `reserved <= onHand`.
- `available` é sempre calculado (`onHand - reserved`), nunca gravado.

Entidades centrais: `Product`, `ProductVariant`, `Inventory`,
`InventoryMovement`, `InventoryReservation`, `Order`, `OrderItem`,
`ProductionTask`, `Payment`, `Shipment`, `Invoice`, `AuditLog`,
`SystemSetting`. Lista completa no `schema.prisma`.

## 8. Autenticação

Implementação própria, sem biblioteca de terceiros:

- Argon2id com parâmetros explícitos. Senha nunca em texto puro.
- Sessão em tabela; o cookie carrega um token opaco e o banco guarda apenas o
  hash. `HttpOnly`, `Secure`, `SameSite=Lax`. Rotação no login para impedir
  session fixation.
- Tokens de verificação de e-mail e reset são de uso único, com TTL, hasheados
  e invalidados no consumo.
- Nada sensível em `localStorage`.
- `middleware.ts` protege `/account`, `/checkout` e `/admin` **no servidor**.
- Admin exige TOTP, tem timeout de sessão mais curto e pede reautenticação em
  operações sensíveis.

Autorização é RBAC com 8 papéis e permissões granulares. `requirePermission`
roda em toda Server Action e Route Handler administrativo — a UI pode esconder
um botão, mas quem decide é o servidor.

## 9. Catálogo

Domínio de perfumaria: tipo do produto (contratipo, importado, nicho, outro),
família olfativa (múltipla, expansível, com subfamílias), concentração como
entidade configurável, notas olfativas como entidade própria (`FragranceNote`)
posicionadas em saída/coração/fundo, volume em mililitros por variante, gênero,
ocasiões, estações, país de origem, e longevidade/projeção **opcionais** —
exibidas só quando cadastradas, tratadas como informação comercial e não como
garantia.

Contratipos têm `inspiredBy`, `referenceBrand` e `referenceFragrance`, sempre
acompanhados de um texto jurídico configurável. A interface deixa clara a
distinção entre **o produto vendido** e a **referência olfativa**; nem o layout
nem o SEO afirmam que o contratipo é o produto da marca de referência.

## 10. Estoque

`Inventory` por variante com `onHand`, `reserved` e `lowStockThreshold`.
Movimentações append-only em 8 tipos: `PURCHASE`, `PRODUCTION`, `SALE`,
`RESERVATION`, `RELEASE`, `RETURN`, `ADJUSTMENT`, `LOSS`.

Reserva acontece em transação com `SELECT ... FOR UPDATE` na linha de
`Inventory`, tem `expiresAt` e chave de idempotência. Pagamento aprovado faz
`commit`; pagamento falho ou expirado faz `release`; um job libera reservas
vencidas. É isso que impede overselling quando dois clientes disputam a última
unidade.

## 11. Produção sob encomenda

Regra central, e a mais fácil de errar: **estoque zero não significa
indisponível**.

| `availabilityType` | `onHand = 0` | Resultado |
|---|---|---|
| `READY_STOCK` | sim | não vende (sem `allowBackorder`) |
| `MADE_TO_ORDER` | sim | vende, gera demanda de produção |
| `OUT_OF_STOCK` | — | não vende |
| `DISCONTINUED` | — | não vende |

Produto híbrido: `onHand = 3` com `allowBackorder = true` vende as 3 primeiras
unidades como pronta entrega e as seguintes sob encomenda. O `OrderItem` guarda
`qtyFromStock` e `qtyBackordered` separadamente.

Hierarquia do prazo de produção, resolvida por uma única função pura:

```
variant.productionLeadTimeDays
  ?? product.productionLeadTimeDays
  ?? settings.defaultProductionLeadTimeDays
  ?? 15
```

`ProductionTask` congela `promisedLeadTimeDays` e
`estimatedProductionReadyAt` **no momento da compra**. Mudar a configuração da
loja depois não altera o prazo prometido a um pedido existente. `OVERDUE` é
derivado (`now > estimated && completedAt == null`), nunca gravado.

## 12. Carrinho

Persistido no banco: por sessão para visitante, por cliente para logado, com
merge no login. `getCart` **sempre** recalcula preço, desconto, disponibilidade,
`qtyFromStock`/`qtyBackordered`, prazo, frete e totais a partir do banco. O
cliente nunca informa preço. Zustand permanece como cache otimista e estado do
drawer.

## 13. Checkout

Campos brasileiros (CEP, logradouro, número, complemento, bairro, cidade, UF,
CPF/CNPJ com dígito verificador). Antes da confirmação, o cliente vê quantos
itens são pronta entrega, quantos são sob encomenda, o prazo de produção
estimado e — sob `SINGLE_SHIPMENT` — o aviso de que o envio ocorre quando todos
os itens estiverem disponíveis. Essa informação aparece **antes** do pagamento.

## 14. Pagamentos

`PaymentProvider` com `createPayment`, `getPayment`, `refund` e
`verifyWebhook`. PIX, cartão tokenizado e boleto. CVV e número completo do
cartão nunca são armazenados. Criação de cobrança é idempotente. O pedido
permanece `AWAITING_PAYMENT` até o provider confirmar — **o navegador nunca
confirma pagamento**.

Webhooks: assinatura verificada, timestamp checado contra replay, evento
persistido em `WebhookEvent` com chave de idempotência, processamento em
transação, retry com backoff e DLQ. Evento duplicado processa uma vez só.

## 15. Pedidos

12 estados: `PENDING`, `AWAITING_PAYMENT`, `PAID`, `WAITING_PRODUCTION`,
`IN_PRODUCTION`, `PRODUCTION_COMPLETED`, `READY_TO_SHIP`, `SHIPPED`,
`DELIVERED`, `CANCELLED`, `REFUNDED`, `PARTIALLY_REFUNDED`. Transições
inválidas lançam. Pedido só de pronta entrega **não** passa por produção.

`OrderItem` é um snapshot imutável: nome, marca, SKU, volume, imagem, preço,
desconto, disponibilidade e prazo de produção no momento da compra. Alterar o
produto depois não reescreve histórico.

## 16. Fiscal

`FiscalProvider` com `issueInvoice`, `getInvoice` e `cancelInvoice`. Emissão
assíncrona e idempotente por pedido após o pagamento aprovado, XML e DANFE
vinculados ao pedido e disponibilizados ao cliente.

## 17. Logística

`ShippingProvider` com `quote`, `createShipment` e `getTracking`, cotando por
CEP, peso e dimensões da variante. O trânsito retornado pelo transportador
**nunca** substitui o prazo de produção: os dois entram separados no
`DeliveryPromiseService`.

## 18. Notificações

`QueueProvider` (tabela em desenvolvimento, SQS depois) com retry, backoff e
DLQ. `NotificationService` com templates editáveis cobrindo conta, pagamento,
produção, envio, rastreio, entrega, cancelamento, reembolso e nota fiscal. Os
textos não prometem data que o sistema não possa cumprir. Nenhum log carrega
senha, CVV, cartão, secret, cookie ou token; CPF, telefone e e-mail são
mascarados.

---

## 19. Infraestrutura alvo

**Não provisionada nesta etapa, por decisão de escopo.** A aplicação é
12-factor: toda configuração vem de variáveis de ambiente validadas em
`src/server/env.ts`, sem dependência de runtime específico.

```
Route 53 → CloudFront → WAF → aplicação Next.js
                                ├── RDS PostgreSQL (Multi-AZ)
                                ├── S3 (presigned POST para uploads)
                                ├── SES (e-mail)
                                ├── SQS + DLQ (jobs)
                                ├── ElastiCache Redis (rate limit, locks)
                                ├── Secrets Manager / SSM
                                └── CloudWatch (logs e métricas)
```

Desenvolvimento local: `docker compose up -d` sobe PostgreSQL 16 e Redis 7.

## 20. Fora de escopo por ora

- Credenciais e integração com provider brasileiro real de pagamento, frete e
  fiscal. As interfaces e a suíte de testes de contrato ficam prontas.
- IaC (CDK/Terraform), provisionamento e deploy.
- Escolha final de hosting.

## 21. Ordem de prioridade em caso de conflito

1. Segurança
2. Integridade financeira
3. Integridade de estoque
4. Integridade de pedidos
5. Transparência do prazo de produção
6. Funcionamento
7. Experiência do usuário
8. Manutenibilidade
9. Performance
10. Estética
