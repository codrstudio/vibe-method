# Plano: Validação de Responsividade Mobile-First

## Contexto

O app deve ser 100% utilizável no mobile. Este plano define a validação de responsividade de todas as páginas.

---

## Páginas Identificadas (15 total)

| # | Rota | Descrição | Prioridade |
|---|------|-----------|------------|
| 1 | `/` | Root (redirect) | Baixa |
| 2 | `/app/login` | Login (4 etapas) | **Alta** |
| 3 | `/app` | Dashboard Home | **Alta** |
| 4 | `/app/settings` | Configurações (placeholder) | Baixa |
| 5 | `/app/settings/messages` | Lista de Templates | Média |
| 6 | `/app/settings/messages/[id]` | Editor de Template | **Alta** |
| 7 | `/app/settings/whatsapp` | WhatsApp Dashboard | Média |
| 8 | `/app/settings/whatsapp/channels` | Lista de Números | Média |
| 9 | `/app/settings/whatsapp/channels/new` | Novo Número | Média |
| 10 | `/app/settings/whatsapp/channels/[id]` | Detalhes do Número | **Alta** |
| 11 | `/app/settings/whatsapp/operations` | Operações WhatsApp | Média |
| 12 | `/app/system/health` | Status do Sistema | Média |
| 13 | `/app/system/health/backbone` | Infraestrutura | Média |
| 14 | `/app/system/health/realtime` | Tempo Real | Média |
| 15 | `/app/offline` | Página Offline | Baixa |

---

## Breakpoints de Teste

| Device | Largura |
|--------|---------|
| Mobile S | 320px |
| Mobile M | 375px |
| Tablet | 768px |

---

## Checklist de Validação

### Prioridade Alta

- [x] `/app/login` - Login ✅
  - [x] 320px - OK
  - [x] 375px - OK
  - [x] 768px - OK
  - **Resultado**: Layout centralizado, inputs usáveis, touch targets adequados

- [x] `/app` - Dashboard Home ✅
  - [x] 320px - OK
  - [x] 375px - OK
  - [x] 768px - OK
  - **Resultado**: MobileBreadcrumb, MobileHeader, FAB implementados corretamente

- [x] `/app/settings/messages/[id]` - Editor de Template ⚠️
  - [x] 320px - ISSUES
  - [x] 375px - ISSUES
  - [x] 768px - OK
  - **Issues**: Header sem tratamento mobile, botões apertados em 320px

- [x] `/app/settings/whatsapp/channels/[id]` - Detalhes do Número ⚠️
  - [x] 320px - ISSUES
  - [x] 375px - ISSUES
  - [x] 768px - OK
  - **Issues**: Breadcrumb longo (4 níveis), TabsList pode ter overflow

### Prioridade Média

- [x] `/app/settings/messages` - Lista de Templates ⚠️
  - [x] 320px - ISSUES
  - [x] 375px - OK
  - [x] 768px - OK
  - **Issues**: Header sem mobile, BUG: link incorreto (falta /app)

- [ ] `/app/settings/whatsapp` - WhatsApp Dashboard
  - [ ] Não validado (requer código fonte adicional)

- [x] `/app/settings/whatsapp/channels` - Lista de Números ✅
  - [x] 320px - OK
  - [x] 375px - OK
  - [x] 768px - OK
  - **Resultado**: Filtros com flex-wrap, grid responsivo

- [ ] `/app/settings/whatsapp/channels/new` - Novo Número
  - [ ] Não validado (requer código fonte adicional)

- [ ] `/app/settings/whatsapp/operations` - Operações WhatsApp
  - [ ] Não validado (requer código fonte adicional)

- [x] `/app/system/health` - Status do Sistema ✅
  - [x] 320px - OK
  - [x] 375px - OK
  - [x] 768px - OK
  - **Resultado**: BreadcrumbBar com mobileActions, classes responsivas

- [x] `/app/system/health/backbone` - Infraestrutura ✅
  - [x] 320px - OK
  - [x] 375px - OK
  - [x] 768px - OK
  - **Resultado**: TabsList com overflow-x-auto, grids responsivos

- [ ] `/app/system/health/realtime` - Tempo Real
  - [ ] Não validado (requer código fonte adicional)

### Prioridade Baixa

- [x] `/` - Root (redirect) ✅
  - [x] 320px - OK (apenas redirect)

- [ ] `/app/settings` - Configurações (placeholder)
  - [ ] Não validado

- [ ] `/app/offline` - Página Offline
  - [ ] Não validado

---

## Critérios de Aceitação

Para cada página/breakpoint, verificar:

1. **Layout**: Elementos não quebram ou sobrepõem
2. **Navegação**: Menu acessível
3. **Touch targets**: Botões com área mínima 44x44px
4. **Texto**: Legível sem zoom horizontal
5. **Formulários**: Inputs usáveis
6. **Tabelas**: Scroll horizontal ou layout alternativo
7. **Modais**: Não ultrapassam viewport

---

## Issues Encontradas

### Crítico (Bugs)

| # | Página | Arquivo | Problema | Ação |
|---|--------|---------|----------|------|
| 1 | `/app/settings/messages` | `settings/messages/page.tsx:173` | Link incorreto: `/settings/messages/${id}` deveria ser `/app/settings/messages/${id}` | Corrigir href |

### Alta Prioridade (Responsividade Quebrada)

| # | Página | Arquivo | Problema | Sugestão |
|---|--------|---------|----------|----------|
| 2 | `/app/settings/messages/[id]` | `settings/messages/[templateId]/page.tsx:227` | Header sem tratamento mobile-first. Breadcrumb visível em 320px pode quebrar. | Usar `BreadcrumbBar` ou adicionar `MobileBreadcrumb` |
| 3 | `/app/settings/messages/[id]` | `settings/messages/[templateId]/page.tsx:240-272` | Botões de ação (Restaurar, Preview, Salvar) apertados em 320px | Usar mobileActions dropdown como em health pages |
| 4 | `/app/settings/whatsapp/channels/[id]` | `settings/whatsapp/channels/[id]/page.tsx:264` | Header sem tratamento mobile-first | Usar `BreadcrumbBar` |
| 5 | `/app/settings/whatsapp/channels/[id]` | `settings/whatsapp/channels/[id]/page.tsx:265-283` | Breadcrumb com 4 níveis quebra em 320px | Truncar ou usar MobileBreadcrumb |
| 6 | `/app/settings/whatsapp/channels/[id]` | `settings/whatsapp/channels/[id]/page.tsx:331-338` | TabsList com 4 tabs pode ter overflow sem scroll | Adicionar `overflow-x-auto` |

### Média Prioridade (Melhorias)

| # | Página | Arquivo | Problema | Sugestão |
|---|--------|---------|----------|----------|
| 7 | `/app/settings/messages` | `settings/messages/page.tsx:89` | Header sem tratamento mobile | Usar `BreadcrumbBar` |
| 8 | `/app/settings/messages` | `settings/messages/page.tsx:121-143` | Filtros de categoria podem quebrar em 320px | Adicionar `flex-wrap` |
| 9 | `/app/settings/whatsapp/channels` | `settings/whatsapp/channels/page.tsx:116` | Header sem tratamento mobile | Usar `BreadcrumbBar` |

---

## Padrões Identificados (Boas Práticas)

### Componentes Mobile-First Existentes
- `MobileHeader` - Header sticky com brand, notificações e menu hamburger
- `MobileBreadcrumb` - Navegação compacta com home e back
- `BreadcrumbBar` - Header unificado com mobileActions dropdown
- `FAB` - Floating Action Button para ações rápidas

### Classes Responsivas Recomendadas
```css
/* Tamanhos de fonte */
text-xs md:text-sm
text-sm md:text-base
text-xl md:text-2xl

/* Espaçamentos */
p-3 md:p-4
gap-3 md:gap-4

/* Grids */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
grid-cols-2 lg:grid-cols-4

/* Visibilidade */
hidden md:flex    /* desktop only */
md:hidden         /* mobile only */

/* Overflow */
overflow-x-auto   /* para TabsList */
```

---

## Resumo

| Status | Contagem |
|--------|----------|
| ✅ Páginas OK | 6 |
| ⚠️ Páginas com Issues | 3 |
| ⏳ Não validadas | 6 |
| 🐛 Bugs encontrados | 1 |
| 🔧 Issues de responsividade | 8 |

---

## Arquivos das Páginas

```
apps/app/app/page.tsx
apps/app/app/app/(auth)/login/page.tsx
apps/app/app/app/(dashboard)/page.tsx
apps/app/app/app/(dashboard)/settings/page.tsx
apps/app/app/app/(dashboard)/settings/messages/page.tsx
apps/app/app/app/(dashboard)/settings/messages/[templateId]/page.tsx
apps/app/app/app/(dashboard)/settings/whatsapp/page.tsx
apps/app/app/app/(dashboard)/settings/whatsapp/channels/page.tsx
apps/app/app/app/(dashboard)/settings/whatsapp/channels/new/page.tsx
apps/app/app/app/(dashboard)/settings/whatsapp/channels/[id]/page.tsx
apps/app/app/app/(dashboard)/settings/whatsapp/operations/page.tsx
apps/app/app/app/(dashboard)/system/health/page.tsx
apps/app/app/app/(dashboard)/system/health/backbone/page.tsx
apps/app/app/app/(dashboard)/system/health/realtime/page.tsx
apps/app/app/app/(special)/offline/page.tsx
```
