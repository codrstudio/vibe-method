# Sistema de Branding

Sistema de identidade visual com suporte a temas (light/dark/system) e paleta de 4 cores.

## Filosofia

O sistema usa **4 cores semanticas** que permitem criar interfaces coloridas e bonitas mantendo consistencia:

| Cor | Proposito | Uso |
|-----|-----------|-----|
| **primary** | Identidade principal | Headers, botoes primarios, links |
| **secondary** | Complemento harmonico | Destaques, badges, icones |
| **tertiary** | Profundidade | Backgrounds sutis, bordas |
| **accent** | Chamada para acao | CTAs, alertas, notificacoes |

Essa estrutura permite:
- Trocar a identidade visual alterando apenas `brand.json`
- Manter harmonia automatica entre cores
- Suportar dark mode sem redesign

## Estrutura de Pastas

```
brand/
├── brand.json           # Configuracao: cores, nome, descricao
├── brand.svg            # FONTE: projeto editavel (Figma export)
├── logotype.svg         # Logo horizontal para headers
├── logotype-dark.svg    # Versao para dark mode
├── icon-16.svg          # Favicon 16x16
├── icon-32.svg          # Favicon 32x32
├── icon-64.svg          # Favicon 64x64
├── icon-128.svg         # Icone para PWA
├── icon-192.svg         # Icone PWA (Android)
├── icon-512.svg         # Icone PWA (splash)
└── favicon.ico          # Favicon compilado (multi-resolucao)
```

**Importante:** `brand.svg` e o **projeto fonte** das imagens (export do Figma/Illustrator). Nao e usado diretamente no sistema - serve como referencia para gerar os outros arquivos.

## Schema do brand.json

```json
{
  "brand": "meu-projeto",
  "title": "Meu Projeto",
  "description": "Descricao curta do projeto",
  "slogan": "Tagline opcional",
  "themes": {
    "light": {
      "primary": "#2a2d6b",
      "secondary": "#35bca9",
      "tertiary": "#1e5a52",
      "accent": "#f97316",
      "background": "#ffffff",
      "surface": "#f8fafc",
      "text": "#1e293b",
      "textMuted": "#64748b"
    },
    "dark": {
      "primary": "#4a4d9b",
      "secondary": "#4dd4c0",
      "tertiary": "#2a8a7a",
      "accent": "#fb923c",
      "background": "#1a1a2e",
      "surface": "#252542",
      "text": "#f1f5f9",
      "textMuted": "#94a3b8"
    }
  }
}
```

### Campos

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `brand` | string | Identificador slug (lowercase, sem espacos) |
| `title` | string | Nome de exibicao |
| `description` | string | Descricao para SEO/meta tags |
| `slogan` | string | Tagline opcional |
| `themes.light` | object | Paleta para tema claro |
| `themes.dark` | object | Paleta para tema escuro |

### Cores do Tema

| Cor | Light | Dark | Uso |
|-----|-------|------|-----|
| `primary` | Cor principal vibrante | Versao mais clara | Identidade, headers |
| `secondary` | Cor complementar | Versao mais clara | Destaques |
| `tertiary` | Tom de suporte | Versao mais clara | Profundidade |
| `accent` | Cor de destaque | Versao mais clara | CTAs, alertas |
| `background` | Branco/claro | Escuro | Fundo da pagina |
| `surface` | Cinza claro | Cinza escuro | Cards, modais |
| `text` | Escuro | Claro | Texto principal |
| `textMuted` | Cinza medio | Cinza medio | Texto secundario |

## Integracao com CSS/Tailwind

### CSS Variables

```css
:root {
  --color-primary: #2a2d6b;
  --color-secondary: #35bca9;
  --color-tertiary: #1e5a52;
  --color-accent: #f97316;
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
}

.dark {
  --color-primary: #4a4d9b;
  --color-secondary: #4dd4c0;
  /* ... */
}
```

### Tailwind Config

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        tertiary: 'var(--color-tertiary)',
        accent: 'var(--color-accent)',
      }
    }
  }
}
```

## Suporte a Temas

O sistema suporta 3 modos:

| Modo | Comportamento |
|------|---------------|
| `light` | Sempre tema claro |
| `dark` | Sempre tema escuro |
| `system` | Segue preferencia do OS |

### Implementacao (Next.js)

```typescript
// next-themes
import { ThemeProvider } from 'next-themes';

<ThemeProvider attribute="class" defaultTheme="system">
  {children}
</ThemeProvider>
```

## Look and Feel

O sistema de branding define **cores e identidade**. O look and feel completo e alcancado combinando com:

### UI Components

**[shadcn/ui](./refs/ux/shadcn.md)** - Biblioteca de componentes
- Componentes acessiveis e customizaveis
- Integra com as CSS variables do brand
- Ver catalogo completo em `refs/ux/shadcn.md`

### Animacoes

**[Framer Motion](./refs/ux/framer-motion.md)** - Animacoes fluidas
- Transicoes de pagina
- Micro-interacoes (hover, tap)
- Stagger animations para listas
- Ver patterns em `refs/ux/framer-motion.md`

### Mobile UX

**[Mobile Patterns](./refs/ux/mobile-patterns.md)** - Padroes mobile-first
- Touch targets (44x44px minimo)
- Gestos (swipe, pull-to-refresh)
- Bottom navigation
- Ver guia em `refs/ux/mobile-patterns.md`

## Checklist de Assets

Ao criar um novo projeto, gerar:

- [ ] `brand.json` com cores definidas
- [ ] `brand.svg` (projeto fonte)
- [ ] `logotype.svg` e `logotype-dark.svg`
- [ ] Icones: 16, 32, 64, 128, 192, 512
- [ ] `favicon.ico` (converter de SVG)
- [ ] CSS variables configuradas
- [ ] Tailwind colors mapeados
- [ ] ThemeProvider configurado

## Ferramentas Uteis

| Ferramenta | Uso | Link |
|------------|-----|------|
| Realtime Colors | Visualizar paleta | https://realtimecolors.com |
| Coolors | Gerar paletas | https://coolors.co |
| shadcn Themes | Gerar tema shadcn | https://ui.shadcn.com/themes |
| Favicon Generator | Gerar favicon.ico | https://favicon.io |

## Exemplo Completo

```json
{
  "brand": "minha-saas",
  "title": "Minha SaaS",
  "description": "Plataforma de gestao inteligente",
  "slogan": "Simplifique sua rotina",
  "themes": {
    "light": {
      "primary": "#6366f1",
      "secondary": "#8b5cf6",
      "tertiary": "#a855f7",
      "accent": "#f59e0b",
      "background": "#ffffff",
      "surface": "#f8fafc",
      "text": "#1e293b",
      "textMuted": "#64748b"
    },
    "dark": {
      "primary": "#818cf8",
      "secondary": "#a78bfa",
      "tertiary": "#c084fc",
      "accent": "#fbbf24",
      "background": "#0f172a",
      "surface": "#1e293b",
      "text": "#f1f5f9",
      "textMuted": "#94a3b8"
    }
  }
}
```
