# Plano: Sistema de Avatar por Rota

## Objetivo

Criar rotas que retornam avatar do usuário como SVG (iniciais + cor highlight).

## Rotas

| Rota | Descrição |
|------|-----------|
| `/app/profile/avatar` | Avatar do usuário logado (JWT) |
| `/app/profile/avatar/[identifier]` | Avatar por ID ou email |

## Arquivos a Criar

### 1. `apps/app/app/app/profile/avatar/route.ts`
Rota para usuário logado:
- Extrai JWT do cookie
- Verifica token com `verifyJWT()`
- Busca usuário no banco pelo `payload.sub`
- Retorna SVG com iniciais

### 2. `apps/app/app/app/profile/avatar/[identifier]/route.ts`
Rota para usuário específico:
- Recebe `identifier` (ID ou email)
- Busca usuário no banco por ID ou email
- Retorna SVG com iniciais
- Retorna 404 se não encontrar

### 3. `apps/app/lib/avatar.ts`
Utilitário para gerar SVG:
- Função `generateAvatarSVG(name: string, size?: number)`
- Extrai iniciais do nome (até 2 caracteres)
- Usa cores do tema: `--highlight` e `--highlight-foreground`
- Retorna string SVG

## Arquivos a Modificar

### 4. `apps/app/lib/hooks/use-session.ts`
- Remover `image` da interface `User`

### 5. `apps/app/app/api/auth/me/route.ts`
- Remover `image` do SELECT e do retorno

### 6. `apps/app/components/app-sidebar.tsx`
- Usar `useSession()` em vez de dados hardcoded
- Passar dados reais para `NavUser`

### 7. `apps/app/components/mobile-drawer.tsx`
- Usar `useSession()` em vez de dados hardcoded
- Usar `/app/profile/avatar` no Avatar

### 8. `apps/app/components/nav-user.tsx`
- Remover prop `avatar` da interface (não mais necessário)
- Usar `/app/profile/avatar` fixo como src do AvatarImage
- Calcular iniciais do nome para AvatarFallback (em vez de "CN" hardcoded)

## Implementação do SVG

```typescript
// apps/app/lib/avatar.ts
export function generateAvatarSVG(name: string, size: number = 40): string {
  const initials = getInitials(name)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="100%" height="100%" fill="hsl(263 33% 52%)" rx="${size * 0.2}"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
          fill="hsl(0 0% 100%)" font-family="system-ui, sans-serif"
          font-size="${size * 0.4}" font-weight="600">
      ${initials}
    </text>
  </svg>`
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}
```

## Resposta da Rota

```typescript
// Retornar SVG como imagem
return new Response(svg, {
  headers: {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'public, max-age=3600', // 1 hora
  },
})
```

## Checklist

- [ ] Criar `apps/app/lib/avatar.ts`
- [ ] Criar `apps/app/app/app/profile/avatar/route.ts`
- [ ] Criar `apps/app/app/app/profile/avatar/[identifier]/route.ts`
- [ ] Modificar `apps/app/lib/hooks/use-session.ts`
- [ ] Modificar `apps/app/app/api/auth/me/route.ts`
- [ ] Modificar `apps/app/components/app-sidebar.tsx`
- [ ] Modificar `apps/app/components/mobile-drawer.tsx`
- [ ] Modificar `apps/app/components/nav-user.tsx`

## Verificacao

1. Acessar `/app/profile/avatar` logado → deve retornar SVG com iniciais
2. Acessar `/app/profile/avatar` deslogado → deve retornar 401
3. Acessar `/app/profile/avatar/1` → deve retornar SVG do usuário 1
4. Acessar `/app/profile/avatar/email@test.com` → deve retornar SVG do usuário
5. Acessar `/app/profile/avatar/inexistente` → deve retornar 404
6. Sidebar deve mostrar avatar real do usuário logado
7. Mobile drawer deve mostrar avatar real do usuário logado
