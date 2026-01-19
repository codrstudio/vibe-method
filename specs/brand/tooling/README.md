# Brand Assets System

Sistema de geração de assets de marca usando blueprints com safe zones visuais.

## Conceito

Este sistema usa **blueprints** (templates SVG com guias visuais) para garantir que suas artes fiquem perfeitamente posicionadas em todos os contextos de uso (web, mobile, PWA, social media).

### Três tipos de arte

| Tipo | Conteúdo | Uso |
|------|----------|-----|
| **ICON** | Apenas o símbolo/logo isolado | Favicons, launcher icons |
| **BRAND** | Logomarca completa (símbolo + texto) | Headers, avatars, perfis |
| **CREATIVE** | Composição visual elaborada | Social media, splash screens |

### Temas

Assets são organizados por tema:

| Tema | Descrição | Quando usar |
|------|-----------|-------------|
| **light** | Fundo claro, elementos escuros | Tema padrão do sistema |
| **dark** | Fundo escuro, elementos claros | Dark mode do sistema |
| **neutral** | Não varia por tema | Screenshots do app |

## Estrutura de Pastas

```
blueprint/
├── source/                 # 1. Artes originais do artista
│   ├── light/
│   │   ├── icon.svg
│   │   ├── brand.svg
│   │   └── creative.svg
│   └── dark/
│       ├── icon.svg
│       ├── brand.svg
│       └── creative.svg
│
├── templates/              # 2. Blueprints com guias visuais
│   ├── favicon.svg
│   ├── icon.svg
│   ├── icon-square.svg
│   ├── icon-square-maskable.svg
│   ├── brand-square.svg
│   ├── creative-square.svg
│   ├── creative-social.svg
│   ├── creative-landscape.svg
│   └── creative-portrait.svg
│
├── positioned/             # 3. Artes posicionadas nos blueprints
│   ├── light/
│   │   ├── favicon.svg
│   │   ├── icon.svg
│   │   ├── icon-square.svg
│   │   ├── icon-maskable.svg
│   │   ├── logotype.svg
│   │   ├── logotype-squared.svg
│   │   ├── splash-artwork.svg
│   │   └── og-image.svg
│   ├── dark/
│   │   ├── icon.svg
│   │   ├── icon-square.svg
│   │   ├── icon-maskable.svg
│   │   ├── logotype.svg
│   │   ├── logotype-squared.svg
│   │   ├── splash-artwork.svg
│   │   └── og-image.svg
│   └── neutral/
│       ├── screenshot-wide.svg
│       └── screenshot-narrow.svg
│
└── scripts/                # 4. Scripts de geração
```

## Mapeamento de Assets

### Assets com tema (light/dark)

| Asset | Blueprint | Arte fonte | Precisa dark? |
|-------|-----------|------------|---------------|
| `favicon.svg` | `favicon.svg` | `icon.svg` | Não (só light) |
| `icon.svg` | `icon.svg` | `icon.svg` | Sim |
| `icon-square.svg` | `icon-square.svg` | `icon.svg` | Sim |
| `icon-maskable.svg` | `icon-square-maskable.svg` | `icon.svg` | Sim |
| `logotype.svg` | `brand-square.svg` | `brand.svg` | Sim |
| `logotype-squared.svg` | `brand-square.svg` | `brand.svg` | Sim |
| `splash-artwork.svg` | `creative-square.svg` | `creative.svg` | Sim |
| `og-image.svg` | `creative-social.svg` | `creative.svg` | Sim |

### Assets neutros (sem tema)

| Asset | Blueprint | Arte fonte | Observação |
|-------|-----------|------------|------------|
| `screenshot-wide.svg` | `creative-landscape.svg` | `creative.svg` | Screenshot do app |
| `screenshot-narrow.svg` | `creative-portrait.svg` | `creative.svg` | Screenshot do app |

## Workflow do Artista

### Passo 1: Crie suas artes em `source/`

Para cada tema, crie 3 arquivos:

```
source/light/
├── icon.svg       # Símbolo isolado (fundo claro)
├── brand.svg      # Logomarca (fundo claro)
└── creative.svg   # Composição visual (fundo claro)

source/dark/
├── icon.svg       # Símbolo isolado (fundo escuro)
├── brand.svg      # Logomarca (fundo escuro)
└── creative.svg   # Composição visual (fundo escuro)
```

### Passo 2: Entenda as guias dos blueprints

Cada blueprint em `templates/` tem guias coloridas pontilhadas:

| Cor | Significado |
|-----|-------------|
| 🔵 Azul | Canvas total / Bleed area |
| 🔴 Vermelho | Viewport visível / Área de corte |
| 🟢 Verde | Safe Zone (área 100% segura) |
| 🟠 Laranja | Safe Zone moderada |

### Passo 3: Posicione nos blueprints

1. Abra o blueprint em `templates/`
2. Importe sua arte de `source/{tema}/`
3. Posicione dentro da **área verde**
4. **Remova as guias coloridas**
5. Salve em `positioned/{tema}/` com o nome correto

### Passo 4: Gere os assets finais

```bash
./scripts/generate-all.sh -o ./output
```

## Blueprints

### ICON

#### `favicon.svg`
| Propriedade | Valor |
|-------------|-------|
| Canvas | 100×100 |
| Safe Zone | 100×100 (100%) |
| Margem | Nenhuma |
| Arte | ICON |
| Uso | favicon.ico, favicon.svg (browser tabs) |

#### `icon.svg`
| Propriedade | Valor |
|-------------|-------|
| Canvas | 100×100 |
| Safe Zone | 100×100 (100%) |
| Margem | Nenhuma |
| Arte | ICON |
| Uso | Sidebar, headers, UI components |

#### `icon-square.svg`
| Propriedade | Valor |
|-------------|-------|
| Canvas | 100×100 |
| Safe Zone | 49×49 (50%) |
| Margem | 25.5px cada lado |
| Arte | ICON |
| Uso | PWA icons (192, 512), apple-touch-icon |

#### `icon-square-maskable.svg`
| Propriedade | Valor |
|-------------|-------|
| Canvas | 125×125 (com bleed) |
| Viewport | 100×100 |
| Safe Zone | 61×61 (50%) |
| Bleed | 12.5px extra |
| Arte | ICON |
| Uso | Android adaptive icons, PWA maskable |

### BRAND

#### `brand-square.svg`
| Propriedade | Valor |
|-------------|-------|
| Canvas | 100×100 |
| Safe Zone Verde | 80×80 (80%) - logotype horizontal |
| Safe Zone Laranja | 24×24 (24%) - logotype compacto |
| Safe Zone Vermelho | 10×10 (10%) - avatares pequenos |
| Arte | BRAND |
| Uso | Headers, footers, avatars, profiles |

### CREATIVE

#### `creative-square.svg`
| Propriedade | Valor |
|-------------|-------|
| Canvas | 142.86×142.86 (com bleed) |
| Viewport | 100×100 |
| Safe Zone | 86×86 (90%) |
| Bleed | 21.43px extra |
| Arte | CREATIVE |
| Uso | iOS splash screens |

#### `creative-social.svg`
| Propriedade | Valor |
|-------------|-------|
| Canvas | 1200×630 (1.9:1) |
| Safe Zone | 1008×440 |
| Margem | 96px H / 95px V |
| Arte | CREATIVE |
| Uso | Open Graph (WhatsApp, Facebook, LinkedIn, Twitter, Slack, Discord) |

#### `creative-landscape.svg`
| Propriedade | Valor |
|-------------|-------|
| Canvas | 1280×720 (16:9) |
| Safe Zone | 1120×576 |
| Margem | 80px H / 72px V |
| Arte | CREATIVE |
| Uso | PWA install prompt (desktop), screenshots |

#### `creative-portrait.svg`
| Propriedade | Valor |
|-------------|-------|
| Canvas | 390×844 (9:19.5) |
| Safe Zone | 326×692 |
| Margem | 32px H / 76px V |
| Arte | CREATIVE |
| Uso | PWA install prompt (mobile) |

## Estrutura de Saída

```
output/
├── favicon.ico                    # ← favicon.svg (sem margem)
├── favicon.svg                    # ← favicon.svg (sem margem)
├── apple-touch-icon.png           # ← icon-square.svg (com margem)
├── og-image.png
├── og-image-dark.png
├── icons/
│   ├── icon-72.png                # ← icon.svg (notificações)
│   ├── icon-192.png               # ← icon-square.svg (PWA)
│   ├── icon-512.png               # ← icon-square.svg (PWA)
│   ├── icon-192-dark.png
│   ├── icon-512-dark.png
│   ├── icon-192-maskable.png      # ← icon-maskable.svg
│   ├── icon-512-maskable.png
│   ├── icon-192-maskable-dark.png
│   └── icon-512-maskable-dark.png
├── splash/
│   ├── splash-750x1334.png
│   ├── splash-750x1334-dark.png
│   └── ... (9 tamanhos × 2 temas)
├── screenshots/
│   ├── screenshot-wide.png
│   └── screenshot-narrow.png
└── brand/
    ├── icon.svg                   # ← icon.svg (UI, sem margem)
    ├── icon-dark.svg              # ← icon.svg dark
    ├── logotype.svg
    ├── logotype-dark.svg
    ├── logotype-squared.svg
    └── logotype-squared-dark.svg
```

## Quick Start

```bash
# 1. Clone esta pasta para seu projeto
cp -r blueprint/ meu-projeto-brand/
cd meu-projeto-brand/

# 2. Crie suas artes em source/light/ e source/dark/

# 3. Posicione nos blueprints (use templates/ como guia)
# Salve em positioned/light/, positioned/dark/, positioned/neutral/

# 4. Gere todos os assets
./scripts/generate-all.sh -o ./output
```

## Dependências

| Ferramenta | Uso | Instalação |
|------------|-----|------------|
| `rsvg-convert` | SVG → PNG | `brew install librsvg` / `apt install librsvg2-bin` |
| `magick` | PNG → ICO | `brew install imagemagick` / `apt install imagemagick` |

## Referências

- [PWA Maskable Icons](https://web.dev/articles/maskable-icon)
- [Android Adaptive Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [Open Graph Protocol](https://ogp.me/)
- [PWA Icon Requirements](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons)
