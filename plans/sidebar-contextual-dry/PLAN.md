# Plano: Sidebar Contextual DRY

## Status: [x] Concluido

## Objetivo
Implementar sidebar contextual que muda conteudo por area, mantendo DRY.

## Abordagem Escolhida
**Single sidebar com deteccao de contexto interna** usando `usePathname()`.

Por que:
- Zero mudancas nos layouts (mais DRY)
- Unica fonte de verdade para navegacao
- Mobile drawer sincronizado automaticamente
- Extensivel: adicionar areas = adicionar a config

---

# PARTE 1: Sidebar Contextual [x] Concluido

## Areas e Menus

| Area | Rota | Itens |
|------|------|-------|
| main | `/app` | Inicio |
| settings | `/app/settings/*` | Inicio, Templates de Mensagens |
| system-health | `/app/system/health/*` | Inicio, Status do Sistema (com subitens) |

**Fixos em todas as areas:**
- Header: Brand (TeamSwitcher)
- Footer: Avatar (NavUser)

## Arquivos Criados

| Arquivo | Descricao |
|---------|-----------|
| `lib/navigation/types.ts` | Interfaces: NavItem, NavSubItem, SidebarArea, NavigationConfig |
| `lib/navigation/config.ts` | Config centralizada de navegacao por area |
| `lib/navigation/use-navigation.ts` | Hook que retorna items baseado em usePathname() |
| `lib/navigation/index.ts` | Barrel export |
| `components/nav-flat.tsx` | Componente para itens simples sem submenu |

## Arquivos Modificados

| Arquivo | Mudancas |
|---------|----------|
| `components/app-sidebar.tsx` | Removido dados hardcoded, usa useNavigation() |
| `components/mobile-drawer.tsx` | Removido navMain hardcoded, usa mesmo hook |

---

# PARTE 2: Refatoracao de Rotas [x] Concluido

## Estrutura de Rotas

### Estado Anterior (errado)
```
/                    → redirect hardcoded para /login
/login               → pagina de login
/dashboard           → dashboard
/settings/*          → configuracoes
/system/health/*     → status do sistema
```

### Estado Esperado
```
/                    → redirect inteligente: /app (logado) ou /app/login (nao logado)
/app/login           → login (redireciona para /app se ja logado)
/app                 → area principal (home)
/app/settings/*      → area de configuracoes
/app/system/health/* → area de system health
```

## Logica de Redirects com Prefixo

### Rota protegida sem login
```
pathname = /app/settings/messages (nao logado)
→ extrai prefixo = "app"
→ redirect para /app/login?callbackUrl=/app/settings/messages
```

### Apos logar
```
login bem sucedido
→ redirect para callbackUrl (se existir) ou /{prefixo}
```

### Compartilhamento de URL
```
Usuario A compartilha: /app/settings/messages
Usuario B (nao logado) acessa
→ redirect para /app/login?callbackUrl=/app/settings/messages
Usuario B loga
→ redirect para /app/settings/messages
```

### Rota root (/)
```
logado?   → /app
nao logado? → /app/login
```

### Rota login (/app/login)
```
ja logado? → /app (ou callbackUrl)
nao logado? → permite (mostra login)
```

## Preparado para Futuro

```
/portal/*        → login em /portal/login
/admin/*         → login em /admin/login
```

Cada prefixo extrai automaticamente seu login path.

## Implementacao

### Passo 1: Mover estrutura de pastas
```
app/login/           → app/app/login/
app/dashboard/       → app/app/ (page.tsx vira home do /app)
app/settings/        → app/app/settings/
app/system/          → app/app/system/
app/offline/         → app/app/offline/
```

### Passo 2: Atualizar app/page.tsx (rota /)
- Nao precisa de logica - middleware intercepta

### Passo 3: Atualizar middleware.ts
```typescript
// Extrai prefixo da rota
function getPrefix(pathname: string): string | null {
  const match = pathname.match(/^\/([^\/]+)/)
  return match ? match[1] : null
}

// Rotas de login por prefixo
const LOGIN_PATHS: Record<string, string> = {
  app: '/app/login',
  portal: '/portal/login',
}

// Logica:
// 1. pathname === '/' → token? /app : /app/login
// 2. pathname === /{prefixo}/login && token → /{prefixo} ou callbackUrl
// 3. pathname.startsWith(/{prefixo}) && !token → /{prefixo}/login?callbackUrl=...
```

### Passo 4: Atualizar navigation config
```typescript
areaPatterns: [
  { pattern: /^\/app\/system\/health/, area: "system-health" },
  { pattern: /^\/app\/settings/, area: "settings" },
  { pattern: /^\/app/, area: "main" }
]

// URLs atualizadas:
homeItem.url = "/app"
messageTemplatesItem.url = "/app/settings/messages"
systemStatusItem.url = "/app/system/health"
// etc.
```

### Passo 5: Atualizar layouts se necessario
- Verificar se layouts precisam de ajuste para nova estrutura

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `app/app/` | Criar pasta (mover conteudo) |
| `app/page.tsx` | Simplificar (middleware cuida) |
| `middleware.ts` | Logica de prefixo + callbackUrl |
| `lib/navigation/config.ts` | URLs com prefixo /app |
| Layouts | Verificar/ajustar paths |

## Verificacao

1. Acessar `/` logado → vai para `/app`
2. Acessar `/` nao logado → vai para `/app/login`
3. Acessar `/app/settings/messages` nao logado → vai para `/app/login?callbackUrl=/app/settings/messages`
4. Logar com callbackUrl → vai para a URL do callback
5. Acessar `/app/login` ja logado → vai para `/app`
6. Sidebar mostra itens corretos em cada area
7. Mobile drawer sincronizado

---

## Extensibilidade Futura

### Adicionar nova area de sidebar (ex: dentro de /app):
1. Adicionar items em `navigationConfig.areas.novaArea`
2. Adicionar pattern: `{ pattern: /^\/app\/nova-area/, area: "novaArea" }`

### Adicionar novo prefixo (ex: /portal):
1. Criar estrutura `app/portal/`
2. Adicionar em `LOGIN_PATHS`: `portal: '/portal/login'`
3. Middleware ja extrai prefixo automaticamente
