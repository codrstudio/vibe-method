# Base Layout Reference

Implementacao de referencia para o sistema de layout definido em `specs/design-layout.md`.

## Visao Geral

Este diretorio contem exemplos de implementacao para os conceitos de layout LAY001-LAY043.
Todos os nomes seguem a nomenclatura definida no vocabulario de design.

## Estrutura

```
refs/base-layout/
├── README.md                           # Este arquivo
└── examples/
    ├── app-shell.tsx                   # LAY001: App Shell
    ├── sidebar.tsx                     # LAY010-LAY014: Sidebar completo
    ├── page-layout.tsx                 # LAY020-LAY023: Page structure
    ├── mobile-header.tsx               # LAY025: Mobile Header
    ├── floating-action-button.tsx      # LAY030: FAB
    └── content-patterns.tsx            # LAY040-LAY043: Content patterns
```

## Dependencias

Os exemplos assumem:
- Next.js 15 (App Router)
- shadcn/ui components
- Tailwind CSS
- Lucide React (icones)

## Mapeamento de Conceitos

| Codigo | Nome | Arquivo |
|--------|------|---------|
| LAY001 | App Shell | `app-shell.tsx` |
| LAY010 | Sidebar | `sidebar.tsx` |
| LAY011 | Brand Area | `sidebar.tsx` |
| LAY012 | Nav Menu | `sidebar.tsx` |
| LAY013 | User Menu | `sidebar.tsx` |
| LAY014 | Menu Item | `sidebar.tsx` |
| LAY020 | Page Content | `page-layout.tsx` |
| LAY021 | Page Header | `page-layout.tsx` |
| LAY022 | Page Body | `page-layout.tsx` |
| LAY023 | Action Bar | `page-layout.tsx` |
| LAY025 | Mobile Header | `mobile-header.tsx` |
| LAY030 | FAB | `floating-action-button.tsx` |
| LAY040 | Search Bar | `content-patterns.tsx` |
| LAY041 | Empty State | `content-patterns.tsx` |
| LAY042 | Loading State | `content-patterns.tsx` |
| LAY043 | Content Grid | `content-patterns.tsx` |

## Uso

### 1. Copiar exemplos relevantes

Os arquivos sao referencias - copie e adapte para seu projeto.

### 2. Instalar dependencias shadcn/ui

```bash
npx shadcn@latest add sidebar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add button
npx shadcn@latest add skeleton
npx shadcn@latest add input
```

### 3. Adaptar nomenclatura

Mantenha os comentarios LAY* para rastreabilidade:

```tsx
// LAY021: Page Header
<div className="flex items-center gap-3">
  {/* ... */}
</div>
```

## Padroes de Espacamento

- **Page Content**: `p-4 md:p-6` com `space-y-6` entre secoes
- **Card Gap**: `gap-3` mobile, `gap-4` desktop
- **Grid Gap**: `gap-4`

## Responsividade

- **Mobile-first**: Classes base para mobile, `md:` para desktop
- **Sidebar**: Drawer em mobile, fixo em desktop
- **FAB**: Visivel em todas as telas (opcao `mobileOnly`)

## Referencias

- Vocabulario: `specs/design-layout.md`
- Metodologia: `method/DESIGN-DOCS.md`
