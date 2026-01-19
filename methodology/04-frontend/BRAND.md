# Sistema de Branding

Sistema de identidade visual com suporte a multi-brand, temas (light/dark) e tokens semanticos.

---

## Indice

1. [Estrutura de Pastas](#estrutura-de-pastas) - Organizacao de brands
2. [Sistema de Cores](#sistema-de-cores) - Palette e tokens
3. [Cores Semanticas](#cores-semanticas) - Feedback e estados
4. [UI Tokens](#ui-tokens) - Selecao e interacao
5. [Assets de Imagem](#assets-de-imagem) - Icones, logos, splash
6. [Gerenciamento](#gerenciamento) - Scripts e comandos
7. [Integracao CSS/Tailwind](#integracao-csstailwind) - Configuracao

---

## Estrutura de Pastas

```
specs/brand/
├── current-brand.json          # Pointer: qual brand esta ativo
├── blueprint/                  # Brand de exemplo/template
│   ├── brand.json              # Cores e tokens
│   ├── source/                 # Artes originais
│   ├── templates/              # Blueprints com guias
│   ├── positioned/             # Artes posicionadas
│   │   ├── light/
│   │   ├── dark/
│   │   └── neutral/
│   └── compiled/               # Assets gerados (PNG, ICO)
├── minha-marca/                # Outro brand
│   └── ...
└── scripts/
    └── brand.sh                # Gerenciamento de brands
```

### Pointer: current-brand.json

Define qual brand esta ativo no projeto:

```json
{
  "current": "blueprint"
}
```

---

## Sistema de Cores

### Filosofia

O sistema usa **duas camadas**:

| Camada | Conteudo | Customizacao |
|--------|----------|--------------|
| `palette` | 7 cores fundamentais | Sempre por brand |
| `tokens` | Cores derivadas | Raramente (usa referencias) |

### Schema: brand.json

```json
{
  "brand": "blueprint",
  "title": "Blueprint",
  "description": "Brand template for vibe-method projects.",
  "slogan": "Your slogan here.",

  "themes": {
    "light": {
      "palette": {
        "background": "#FFFFFF",
        "foreground": "#1E293B",
        "surface": "#F8FAFC",
        "primary": "#7C3AED",
        "secondary": "#5B21B6",
        "tertiary": "#6B7280",
        "accent": "#F59E0B"
      },
      "tokens": {
        "foreground-inverse": "{background}",

        "surface-foreground": "{foreground}",
        "primary-foreground": "{foreground-inverse}",
        "secondary-foreground": "{foreground-inverse}",
        "tertiary-foreground": "{foreground-inverse}",
        "accent-foreground": "{foreground-inverse}",

        "trace": "#64748B",
        "trace-foreground": "{foreground-inverse}",
        "info": "#3B82F6",
        "info-foreground": "{foreground-inverse}",
        "highlight": "#8B5CF6",
        "highlight-foreground": "{foreground-inverse}",
        "success": "#10B981",
        "success-foreground": "{foreground-inverse}",
        "warning": "#F59E0B",
        "warning-foreground": "{foreground}",
        "error": "#EF4444",
        "error-foreground": "{foreground-inverse}",
        "critical": "#EC4899",
        "critical-foreground": "{foreground-inverse}"
      }
    },
    "dark": {
      "palette": {
        "background": "#0F172A",
        "foreground": "#F1F5F9",
        "surface": "#1E293B",
        "primary": "#A78BFA",
        "secondary": "#8B5CF6",
        "tertiary": "#94A3B8",
        "accent": "#FBBF24"
      },
      "tokens": {
        "...": "mesma estrutura, referencias resolvem automaticamente"
      }
    }
  }
}
```

### Palette (7 cores)

| Token | Proposito |
|-------|-----------|
| `background` | Fundo da pagina |
| `foreground` | Texto principal |
| `surface` | Cards, modais, elevacoes |
| `primary` | Identidade principal, CTAs |
| `secondary` | Acoes secundarias |
| `tertiary` | Elementos sutis |
| `accent` | Destaques especiais |

### Tokens Derivados

| Token | Default | Proposito |
|-------|---------|-----------|
| `foreground-inverse` | `{background}` | Texto sobre cores saturadas |
| `*-foreground` | `{foreground-inverse}` | Texto sobre cada cor |

### Sintaxe de Referencias

```json
"{foreground}"       // Referencia direta
"{foreground-inverse}" // Referencia a outro token
```

**Por que referencias?**
- Define uma vez, usa em varios lugares
- Muda `foreground-inverse` = atualiza todos os `*-foreground`
- Customizacao pontual sem duplicacao

### Exemplo: Background Beige

```json
{
  "palette": {
    "background": "#F5F5DC",
    "foreground": "#1A1A1A",
    "primary": "#1E3A5F"
  },
  "tokens": {
    "foreground-inverse": "#FFFFFF",
    "primary-foreground": "{foreground-inverse}"
  }
}
```

Aqui `foreground-inverse` e branco (nao beige) porque primary e azul marinho e precisa de contraste forte.

---

## Cores Semanticas

Cores para feedback e estados. Variam entre light/dark para manter contraste.

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `trace` | slate-500 | slate-400 | Logs, disabled, timestamps |
| `info` | blue-500 | blue-400 | Informativo neutro |
| `highlight` | violet-500 | violet-400 | Novo, beta, enfase |
| `success` | emerald-500 | emerald-400 | Confirmacao, ok |
| `warning` | amber-500 | amber-400 | Atencao, acao recomendada |
| `error` | red-500 | red-400 | Falha, acao necessaria |
| `critical` | pink-500 | pink-400 | Sistema fora, bloqueante |

### Valores Default (Tailwind)

```json
{
  "tokens": {
    "trace": "#64748B",
    "trace-foreground": "{foreground-inverse}",
    "info": "#3B82F6",
    "info-foreground": "{foreground-inverse}",
    "highlight": "#8B5CF6",
    "highlight-foreground": "{foreground-inverse}",
    "success": "#10B981",
    "success-foreground": "{foreground-inverse}",
    "warning": "#F59E0B",
    "warning-foreground": "{foreground}",
    "error": "#EF4444",
    "error-foreground": "{foreground-inverse}",
    "critical": "#EC4899",
    "critical-foreground": "{foreground-inverse}"
  }
}
```

**Nota:** `warning-foreground` usa `{foreground}` (escuro) porque amarelo precisa de texto escuro para contraste.

---

## UI Tokens

Tokens para padroes de UI. **Nao fazem parte do brand.json** - sao derivados no CSS.

### Selecao

| Token | Opacidade | Uso |
|-------|-----------|-----|
| `context` | 8% | "Voce esta nesta area" (hover, ancestral) |
| `current` | 20% | "Este e o item ativo" (selecionado) |

```css
:root {
  --selection-context: rgb(from var(--foreground) r g b / 8%);
  --selection-current: rgb(from var(--foreground) r g b / 20%);
}
```

### Interacao

```css
:root {
  --hover: rgb(from var(--foreground) r g b / 8%);
  --active: rgb(from var(--foreground) r g b / 16%);
  --focus-ring: var(--primary);
  --focus-offset: var(--background);
}
```

### Bordas

```css
:root {
  --border: rgb(from var(--foreground) r g b / 12%);
  --border-muted: rgb(from var(--foreground) r g b / 6%);
}
```

---

## Regra Critica: Cores via Tokens

**Cores sao definidas UMA UNICA VEZ em tokens CSS e consumidas em todo o sistema.**

### Proibido

```tsx
// ERRADO: Cores Tailwind diretas
<div className="bg-blue-500 text-gray-600">

// ERRADO: Cores hex inline
<div style={{ backgroundColor: '#3b82f6' }}>

// ERRADO: Opacidade hardcoded
<div className="bg-primary/20">
```

### Permitido

```tsx
// CORRETO: Tokens semanticos
<div className="bg-primary text-primary-foreground">

// CORRETO: Tokens de selecao
<div className="bg-selection-current">

// CORRETO: CSS variables
<div style={{ backgroundColor: 'var(--surface)' }}>
```

### Regra de Ouro

> Se a cor nao vier de um token CSS, esta errado.

---

## Assets de Imagem

### Estrutura por Tema

```
{brand}/positioned/
├── light/
│   ├── icon-square.svg           # Icone principal
│   ├── icon-square-maskable.svg  # Icone com safe zone
│   ├── brand-square.svg          # Logotipo
│   ├── creative-square.svg       # Arte para splash
│   └── creative-social.svg       # OG image
├── dark/
│   └── ... (mesmos arquivos)
└── neutral/
    ├── screenshot-wide.svg       # Desktop (1280x720)
    └── screenshot-narrow.svg     # Mobile (390x844)
```

### Assets Gerados (compiled/)

```
{brand}/compiled/
├── favicon.ico
├── favicon.svg
├── apple-touch-icon.png
├── og-image.png
├── og-image-dark.png
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-192-dark.png
│   ├── icon-512-dark.png
│   ├── icon-192-maskable.png
│   ├── icon-512-maskable.png
│   ├── icon-192-maskable-dark.png
│   └── icon-512-maskable-dark.png
├── splash/
│   ├── splash-750x1334.png
│   ├── splash-750x1334-dark.png
│   └── ... (9 tamanhos x 2 temas)
├── screenshots/
│   ├── screenshot-wide.png
│   └── screenshot-narrow.png
└── brand/
    ├── logotype.svg
    ├── logotype-dark.svg
    ├── logotype-squared.svg
    └── logotype-squared-dark.svg
```

### Tamanhos de Splash (iOS)

| Tamanho | Device |
|---------|--------|
| 750x1334 | iPhone SE/8 |
| 1170x2532 | iPhone 12-14 |
| 1179x2556 | iPhone 14/15 Pro |
| 1284x2778 | iPhone Pro Max |
| 1290x2796 | iPhone 14/15 Pro Max |
| 1320x2868 | iPhone 16 Pro Max |
| 1536x2048 | iPad |
| 1668x2388 | iPad Pro 11" |
| 2048x2732 | iPad Pro 12.9" |

---

## Gerenciamento

### Script: brand.sh

```bash
# Listar brands
./brand.sh list

# Compilar assets (SVG -> PNG/ICO)
./brand.sh compile <brand>

# Selecionar brand (copia para public/)
./brand.sh select <brand>
```

### Dependencias

| Ferramenta | Uso | Instalacao |
|------------|-----|------------|
| `rsvg-convert` | SVG -> PNG | `brew install librsvg` |
| `magick` | PNG -> ICO | `brew install imagemagick` |

### Exemplo de Uso

```bash
# Ver brands disponiveis
$ ./brand.sh list

Brands encontrados:
  blueprint      compiled    (selecionado)
  minha-marca    draft

# Compilar brand
$ ./brand.sh compile minha-marca

Compilando brand: minha-marca
-> Processando icon-square.svg (light)
-> Processando icon-square-maskable.svg (light)
...
Brand 'minha-marca' compilado com sucesso!
Total: 42 arquivos

# Selecionar brand
$ ./brand.sh select minha-marca

Brand 'minha-marca' selecionado!
Assets copiados para: apps/app/public/
```

---

## Integracao CSS/Tailwind

### CSS Variables

```css
:root {
  /* Palette */
  --background: #FFFFFF;
  --foreground: #1E293B;
  --surface: #F8FAFC;
  --primary: #7C3AED;
  --secondary: #5B21B6;
  --tertiary: #6B7280;
  --accent: #F59E0B;

  /* Tokens */
  --foreground-inverse: var(--background);
  --surface-foreground: var(--foreground);
  --primary-foreground: var(--foreground-inverse);
  --secondary-foreground: var(--foreground-inverse);
  --tertiary-foreground: var(--foreground-inverse);
  --accent-foreground: var(--foreground-inverse);

  /* Semanticas */
  --trace: #64748B;
  --trace-foreground: var(--foreground-inverse);
  --info: #3B82F6;
  --info-foreground: var(--foreground-inverse);
  --highlight: #8B5CF6;
  --highlight-foreground: var(--foreground-inverse);
  --success: #10B981;
  --success-foreground: var(--foreground-inverse);
  --warning: #F59E0B;
  --warning-foreground: var(--foreground);
  --error: #EF4444;
  --error-foreground: var(--foreground-inverse);
  --critical: #EC4899;
  --critical-foreground: var(--foreground-inverse);

  /* UI */
  --selection-context: rgb(from var(--foreground) r g b / 8%);
  --selection-current: rgb(from var(--foreground) r g b / 20%);
  --hover: rgb(from var(--foreground) r g b / 8%);
  --active: rgb(from var(--foreground) r g b / 16%);
  --border: rgb(from var(--foreground) r g b / 12%);
  --border-muted: rgb(from var(--foreground) r g b / 6%);
}

.dark {
  --background: #0F172A;
  --foreground: #F1F5F9;
  --surface: #1E293B;
  --primary: #A78BFA;
  --secondary: #8B5CF6;
  --tertiary: #94A3B8;
  --accent: #FBBF24;

  /* Semanticas (ajustadas para dark) */
  --trace: #94A3B8;
  --info: #60A5FA;
  --highlight: #A78BFA;
  --success: #34D399;
  --warning: #FBBF24;
  --error: #F87171;
  --critical: #F472B6;
}
```

### Tailwind Config

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          DEFAULT: 'var(--surface)',
          foreground: 'var(--surface-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          foreground: 'var(--tertiary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        trace: {
          DEFAULT: 'var(--trace)',
          foreground: 'var(--trace-foreground)',
        },
        info: {
          DEFAULT: 'var(--info)',
          foreground: 'var(--info-foreground)',
        },
        highlight: {
          DEFAULT: 'var(--highlight)',
          foreground: 'var(--highlight-foreground)',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
        },
        error: {
          DEFAULT: 'var(--error)',
          foreground: 'var(--error-foreground)',
        },
        critical: {
          DEFAULT: 'var(--critical)',
          foreground: 'var(--critical-foreground)',
        },
        // UI
        border: 'var(--border)',
        hover: 'var(--hover)',
        active: 'var(--active)',
        selection: {
          context: 'var(--selection-context)',
          current: 'var(--selection-current)',
        },
      }
    }
  }
}
```

---

## Checklist de Novo Brand

- [ ] Criar pasta `specs/brand/{nome}/`
- [ ] Copiar estrutura de `blueprint/`
- [ ] Editar `brand.json` com cores do brand
- [ ] Criar artes em `source/`
- [ ] Posicionar artes em `positioned/`
- [ ] Compilar: `./brand.sh compile {nome}`
- [ ] Selecionar: `./brand.sh select {nome}`
- [ ] Verificar `current-brand.json` atualizado

---

## Ferramentas Uteis

| Ferramenta | Uso | Link |
|------------|-----|------|
| Realtime Colors | Visualizar paleta | https://realtimecolors.com |
| Coolors | Gerar paletas | https://coolors.co |
| Maskable.app | Testar maskable icons | https://maskable.app |
| OpenGraph.xyz | Testar OG image | https://opengraph.xyz |
