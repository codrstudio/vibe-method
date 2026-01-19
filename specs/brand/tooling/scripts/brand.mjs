#!/usr/bin/env node
/**
 * Brand Management Script
 *
 * Gerencia múltiplos brands: list, compile, apply
 *
 * Uso:
 *   node brand.mjs list
 *   node brand.mjs compile <brand>
 *   node brand.mjs apply <brand> [-t|--theme-only] [-a|--assets-only]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// FALLBACK NODE.JS PARA DEPENDÊNCIAS CLI
// ============================================================================

let resvgModule = null;
let pngToIcoModule = null;
let useNodeJsFallback = false;

async function loadNodeJsDependencies() {
  try {
    resvgModule = await import('@resvg/resvg-js');
    const pngToIco = await import('png-to-ico');
    pngToIcoModule = pngToIco.default;
    return true;
  } catch {
    return false;
  }
}

function svgToPngNodeJs(input, output, width, height = width) {
  const svg = fs.readFileSync(input, 'utf8');
  const opts = {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: false }
  };
  const resvgJs = new resvgModule.Resvg(svg, opts);
  const pngData = resvgJs.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(output, pngBuffer);
}

async function generateFaviconIcoNodeJs(inputSvg, outputIco, tempDir) {
  const sizes = [16, 32, 48];
  const pngBuffers = [];

  for (const size of sizes) {
    const pngFile = path.join(tempDir, `favicon-${size}.png`);
    svgToPngNodeJs(inputSvg, pngFile, size);
    pngBuffers.push(fs.readFileSync(pngFile));
  }

  const icoBuffer = await pngToIcoModule(pngBuffers);
  fs.writeFileSync(outputIco, icoBuffer);
}

// ============================================================================
// CORES E FORMATAÇÃO
// ============================================================================

const colors = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

const log = {
  error: (msg) => console.error(colors.red(`✗ ${msg}`)),
  success: (msg) => console.log(colors.green(`✓ ${msg}`)),
  warning: (msg) => console.log(colors.yellow(`⚠ ${msg}`)),
  info: (msg) => console.log(colors.blue(`ℹ ${msg}`)),
  step: (msg) => console.log(colors.cyan(`→ ${msg}`)),
};

// ============================================================================
// DIÁLOGO DE ERRO (ESTILO BOX)
// ============================================================================

/**
 * Exibe um diálogo de erro formatado no terminal
 * @param {string} title - Título do erro
 * @param {string[]} messages - Linhas de mensagem
 * @param {object} options - Opções adicionais
 */
function showErrorDialog(title, messages, options = {}) {
  const { hint, details } = options;

  // Calcular largura máxima
  const allLines = [title, ...messages];
  if (hint) allLines.push(hint);
  if (details) allLines.push(...details);
  const maxLen = Math.max(...allLines.map(l => l.replace(/\x1b\[[0-9;]*m/g, '').length), 40);
  const width = maxLen + 4;

  const hr = '─'.repeat(width);
  const pad = (s, len = width) => {
    const cleanLen = s.replace(/\x1b\[[0-9;]*m/g, '').length;
    return s + ' '.repeat(Math.max(0, len - cleanLen));
  };

  console.log('');
  console.log(colors.red(`┌${hr}┐`));
  console.log(colors.red(`│ ${pad(colors.bold(title))} │`));
  console.log(colors.red(`├${hr}┤`));

  for (const msg of messages) {
    console.log(colors.red(`│ ${pad(msg)} │`));
  }

  if (details && details.length > 0) {
    console.log(colors.red(`├${hr}┤`));
    for (const detail of details) {
      console.log(colors.red(`│ ${pad(colors.dim(detail))} │`));
    }
  }

  if (hint) {
    console.log(colors.red(`├${hr}┤`));
    console.log(colors.red(`│ ${pad(colors.yellow(hint))} │`));
  }

  console.log(colors.red(`└${hr}┘`));
  console.log('');
}

// ============================================================================
// CONVERSÃO DE CORES
// ============================================================================

/**
 * Converte HEX para HSL
 * @param {string} hex - Cor em formato #RRGGBB ou #RRGGBBAA
 * @returns {string} - Cor em formato "H S% L%" (sem hsl())
 */
function hexToHsl(hex) {
  if (!hex || typeof hex !== 'string') return '0 0% 0%';

  // Remove # e handle alpha
  hex = hex.replace('#', '');
  let alpha = null;

  if (hex.length === 8) {
    alpha = parseInt(hex.slice(6, 8), 16) / 255;
    hex = hex.slice(0, 6);
  } else if (hex.length === 4) {
    // Handle #RGBA format
    alpha = parseInt(hex[3] + hex[3], 16) / 255;
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  } else if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  if (alpha !== null && alpha < 1) {
    return `${hDeg} ${sPct}% ${lPct}% / ${Math.round(alpha * 100)}%`;
  }
  return `${hDeg} ${sPct}% ${lPct}%`;
}

/**
 * Resolve referências de tokens como {foreground}
 * @param {string} value - Valor que pode conter referência
 * @param {object} context - Objeto com palette, tokens e custom
 * @param {Set} visited - Previne loops infinitos
 * @returns {string} - Valor resolvido (hex)
 */
function resolveRef(value, context, visited = new Set()) {
  if (!value || typeof value !== 'string') return value;

  // Se não é uma referência, retorna o valor
  if (!value.startsWith('{') || !value.endsWith('}')) {
    return value;
  }

  const ref = value.slice(1, -1);

  // Previne loops infinitos
  if (visited.has(ref)) {
    log.warning(`Referência circular detectada: ${ref}`);
    return '#FF00FF'; // Magenta como fallback para debug
  }
  visited.add(ref);

  // Busca na ordem: palette > tokens > custom
  const { palette, tokens, custom } = context;
  let resolved = palette[ref] || tokens[ref] || custom[ref];

  if (resolved) {
    // Resolve recursivamente se ainda for uma referência
    return resolveRef(resolved, context, visited);
  }

  log.warning(`Referência não encontrada: ${ref}`);
  return '#FF00FF'; // Magenta como fallback para debug
}

/**
 * Resolve todas as referências e converte para HSL
 * @param {string} value - Valor hex ou referência
 * @param {object} context - Contexto com palette, tokens, custom
 * @returns {string} - Valor em HSL
 */
function resolveAndConvert(value, context) {
  const resolved = resolveRef(value, context);
  return hexToHsl(resolved);
}

// ============================================================================
// FUNÇÕES DE DESCOBERTA DE DIRETÓRIOS
// ============================================================================

function findBrandsDir() {
  let current = process.cwd();
  while (current !== path.dirname(current)) {
    const brandsDir = path.join(current, 'specs', 'brand');
    if (fs.existsSync(brandsDir)) {
      return brandsDir;
    }
    current = path.dirname(current);
  }
  return null;
}

function findPublicDir() {
  let current = process.cwd();
  while (current !== path.dirname(current)) {
    // Monorepo: apps/app/public/
    const monorepo = path.join(current, 'apps', 'app', 'public');
    if (fs.existsSync(monorepo)) return monorepo;
    // Projeto simples: public/
    const simple = path.join(current, 'public');
    if (fs.existsSync(simple)) return simple;
    current = path.dirname(current);
  }
  return null;
}

function findAppDir() {
  let current = process.cwd();
  while (current !== path.dirname(current)) {
    // Monorepo Next.js App Router: apps/app/app/
    const monorepoApp = path.join(current, 'apps', 'app', 'app');
    if (fs.existsSync(monorepoApp)) return monorepoApp;
    // Monorepo: apps/app/src/app/
    const monorepoSrc = path.join(current, 'apps', 'app', 'src', 'app');
    if (fs.existsSync(monorepoSrc)) return monorepoSrc;
    // Projeto simples: app/
    const simpleApp = path.join(current, 'app');
    if (fs.existsSync(simpleApp)) return simpleApp;
    // Projeto simples: src/app/
    const simpleSrc = path.join(current, 'src', 'app');
    if (fs.existsSync(simpleSrc)) return simpleSrc;
    current = path.dirname(current);
  }
  return null;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function listBrands(brandsDir) {
  const entries = fs.readdirSync(brandsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .filter((e) => !['tooling', 'blueprint', 'scripts'].includes(e.name))
    .filter((e) => fs.existsSync(path.join(brandsDir, e.name, 'positioned')) ||
                   fs.existsSync(path.join(brandsDir, e.name, 'brand.json')))
    .map((e) => e.name);
}

function getBrandStatus(brandDir) {
  const compiledDir = path.join(brandDir, 'compiled');
  if (!fs.existsSync(compiledDir)) return 'draft';
  const files = fs.readdirSync(compiledDir, { recursive: true });
  return files.length > 0 ? 'compiled' : 'draft';
}

// ============================================================================
// COMANDO: LIST
// ============================================================================

function cmdList() {
  const brandsDir = findBrandsDir();
  if (!brandsDir) {
    log.error('Diretório specs/brand/ não encontrado');
    process.exit(1);
  }

  const brands = listBrands(brandsDir);

  if (brands.length === 0) {
    log.warning('Nenhum brand encontrado');
    console.log('\nPara criar um brand:');
    console.log('  1. Crie specs/brand/<nome>/brand.json');
    console.log('  2. Adicione SVGs em positioned/');
    return;
  }

  console.log(`\n${colors.bold('Brands encontrados:')}\n`);

  for (const brand of brands) {
    const brandDir = path.join(brandsDir, brand);
    const status = getBrandStatus(brandDir);
    const statusColor = status === 'compiled' ? colors.green : colors.yellow;

    console.log(`  ${colors.bold(brand.padEnd(15))} ${statusColor(status)}`);
  }

  console.log('');
}

// ============================================================================
// COMANDO: COMPILE
// ============================================================================

async function checkCompileDependencies() {
  const missing = [];
  let hasRsvg = false;
  let hasImageMagick = false;

  try {
    execSync('rsvg-convert --version', { stdio: 'ignore' });
    hasRsvg = true;
  } catch {
    missing.push('rsvg-convert (librsvg)');
  }

  try {
    execSync('magick --version', { stdio: 'ignore' });
    hasImageMagick = true;
  } catch {
    try {
      execSync('convert --version', { stdio: 'ignore' });
      hasImageMagick = true;
    } catch {
      missing.push('magick/convert (ImageMagick)');
    }
  }

  // Se todas as CLIs estão disponíveis, usar CLI
  if (hasRsvg && hasImageMagick) {
    useNodeJsFallback = false;
    return true;
  }

  // Tentar fallback Node.js
  const nodeJsAvailable = await loadNodeJsDependencies();
  if (nodeJsAvailable) {
    useNodeJsFallback = true;
    log.info('Usando fallback Node.js (@resvg/resvg-js + png-to-ico)');
    return true;
  }

  // Nenhuma opção disponível
  log.error('Dependências faltando:');
  missing.forEach((dep) => console.log(`  - ${dep}`));
  console.log('\nOpção 1 - Instalar CLIs:');
  console.log('  macOS:  brew install librsvg imagemagick');
  console.log('  Ubuntu: apt install librsvg2-bin imagemagick');
  console.log('  Windows: choco install librsvg imagemagick');
  console.log('\nOpção 2 - Instalar dependências Node.js:');
  console.log('  npm install -D @resvg/resvg-js png-to-ico');
  return false;
}

function svgToPng(input, output, width, height = width) {
  if (useNodeJsFallback) {
    svgToPngNodeJs(input, output, width, height);
  } else {
    execSync(`rsvg-convert -w ${width} -h ${height} -o "${output}" "${input}"`);
  }
}

async function generateFaviconIco(inputSvg, outputIco, tempDir) {
  if (useNodeJsFallback) {
    await generateFaviconIcoNodeJs(inputSvg, outputIco, tempDir);
    return;
  }

  const sizes = [16, 32, 48];
  const pngFiles = [];

  for (const size of sizes) {
    const pngFile = path.join(tempDir, `favicon-${size}.png`);
    svgToPng(inputSvg, pngFile, size);
    pngFiles.push(pngFile);
  }

  const magickCmd = process.platform === 'win32' ? 'magick' : 'convert';
  try {
    execSync(`${magickCmd} ${pngFiles.map((f) => `"${f}"`).join(' ')} "${outputIco}"`);
  } catch {
    execSync(`convert ${pngFiles.map((f) => `"${f}"`).join(' ')} "${outputIco}"`);
  }
}

function findAsset(dir, ...names) {
  for (const name of names) {
    const filePath = path.join(dir, name);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

const SPLASH_SIZES = [
  '750x1334', '1170x2532', '1179x2556', '1284x2778',
  '1290x2796', '1320x2868', '1536x2048', '1668x2388', '2048x2732',
];

async function processTheme(positionedDir, compiledDir, theme, tempDir) {
  const suffix = theme === 'dark' ? '-dark' : '';
  const themeDir = path.join(positionedDir, theme);

  if (!fs.existsSync(themeDir)) {
    log.warning(`Tema ${theme} não encontrado em positioned/`);
    return;
  }

  let assetFile;

  // ICON → favicon.ico, favicon.svg (sem margem)
  assetFile = findAsset(themeDir, 'icon.svg');
  if (assetFile && theme === 'light') {
    log.step(`Processando ${path.basename(assetFile)} → favicon (${theme})`);
    fs.copyFileSync(assetFile, path.join(compiledDir, 'favicon.svg'));
    await generateFaviconIco(assetFile, path.join(compiledDir, 'favicon.ico'), tempDir);
  }

  // ICON-UI → UI icons (sem margem)
  assetFile = findAsset(themeDir, 'icon-ui.svg');
  if (assetFile) {
    log.step(`Processando ${path.basename(assetFile)} → brand/icon (${theme})`);

    if (theme === 'light') {
      // icon-72 para badge de notificações (apenas light)
      svgToPng(assetFile, path.join(compiledDir, 'icons', 'icon-72.png'), 72);
    }

    // brand/icon.svg para uso em UI (sidebar, headers)
    fs.copyFileSync(assetFile, path.join(compiledDir, 'brand', `icon${suffix}.svg`));
  }

  // ICON-SQUARE → PWA icons, apple-touch-icon (com margem)
  assetFile = findAsset(themeDir, 'icon-square.svg');
  if (assetFile) {
    log.step(`Processando ${path.basename(assetFile)} (${theme})`);

    if (theme === 'light') {
      svgToPng(assetFile, path.join(compiledDir, 'apple-touch-icon.png'), 180);
    }

    svgToPng(assetFile, path.join(compiledDir, 'icons', `icon-192${suffix}.png`), 192);
    svgToPng(assetFile, path.join(compiledDir, 'icons', `icon-512${suffix}.png`), 512);
  }

  // ICON-MASKABLE → maskable PWA icons
  assetFile = findAsset(themeDir, 'icon-maskable.svg', 'icon-square-maskable.svg');
  if (assetFile) {
    log.step(`Processando ${path.basename(assetFile)} (${theme})`);
    svgToPng(assetFile, path.join(compiledDir, 'icons', `icon-192-maskable${suffix}.png`), 192);
    svgToPng(assetFile, path.join(compiledDir, 'icons', `icon-512-maskable${suffix}.png`), 512);
  }

  // BRAND → brand SVGs
  assetFile = findAsset(themeDir, 'brand-square.svg', 'logotype.svg');
  if (assetFile) {
    log.step(`Processando ${path.basename(assetFile)} (${theme})`);
    fs.copyFileSync(assetFile, path.join(compiledDir, 'brand', `logotype${suffix}.svg`));
    fs.copyFileSync(assetFile, path.join(compiledDir, 'brand', `logotype-squared${suffix}.svg`));
  }

  // SPLASH → splash screens
  assetFile = findAsset(themeDir, 'creative-square.svg', 'splash-artwork.svg');
  if (assetFile) {
    log.step(`Processando ${path.basename(assetFile)} (${theme})`);
    for (const size of SPLASH_SIZES) {
      const [width, height] = size.split('x').map(Number);
      svgToPng(assetFile, path.join(compiledDir, 'splash', `splash-${size}${suffix}.png`), width, height);
    }
  }

  // OG-IMAGE → Open Graph images
  assetFile = findAsset(themeDir, 'creative-social.svg', 'og-image.svg');
  if (assetFile) {
    log.step(`Processando ${path.basename(assetFile)} (${theme})`);
    svgToPng(assetFile, path.join(compiledDir, `og-image${suffix}.png`), 1200, 630);
  }
}

function processNeutral(positionedDir, compiledDir) {
  const neutralDir = path.join(positionedDir, 'neutral');
  if (!fs.existsSync(neutralDir)) return;

  const wideScreenshot = path.join(neutralDir, 'screenshot-wide.svg');
  if (fs.existsSync(wideScreenshot)) {
    log.step('Processando screenshot-wide.svg → desktop.png');
    svgToPng(wideScreenshot, path.join(compiledDir, 'screenshots', 'desktop.png'), 1280, 720);
  }

  const narrowScreenshot = path.join(neutralDir, 'screenshot-narrow.svg');
  if (fs.existsSync(narrowScreenshot)) {
    log.step('Processando screenshot-narrow.svg → mobile.png');
    svgToPng(narrowScreenshot, path.join(compiledDir, 'screenshots', 'mobile.png'), 390, 844);
  }
}

async function cmdCompile(brandName) {
  if (!brandName) {
    log.error('Uso: brand.mjs compile <brand>');
    process.exit(1);
  }

  const brandsDir = findBrandsDir();
  if (!brandsDir) {
    log.error('Diretório specs/brand/ não encontrado');
    process.exit(1);
  }

  const brandDir = path.join(brandsDir, brandName);
  if (!fs.existsSync(brandDir)) {
    log.error(`Brand '${brandName}' não encontrado`);
    process.exit(1);
  }

  const positionedDir = path.join(brandDir, 'positioned');
  if (!fs.existsSync(positionedDir)) {
    log.error(`Brand '${brandName}' não tem pasta positioned/`);
    process.exit(1);
  }

  if (!(await checkCompileDependencies())) {
    process.exit(1);
  }

  log.info(`Compilando brand: ${brandName}`);
  console.log('');

  const compiledDir = path.join(brandDir, 'compiled');
  const tempDir = path.join(brandDir, '.tmp-compile');

  // Limpar e criar estrutura
  fs.rmSync(compiledDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(compiledDir, 'icons'), { recursive: true });
  fs.mkdirSync(path.join(compiledDir, 'splash'), { recursive: true });
  fs.mkdirSync(path.join(compiledDir, 'screenshots'), { recursive: true });
  fs.mkdirSync(path.join(compiledDir, 'brand'), { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    await processTheme(positionedDir, compiledDir, 'light', tempDir);
    await processTheme(positionedDir, compiledDir, 'dark', tempDir);
    processNeutral(positionedDir, compiledDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log('');
  log.success(`Brand '${brandName}' compilado!`);

  const fileCount = fs.readdirSync(compiledDir, { recursive: true }).filter((f) => {
    const fullPath = path.join(compiledDir, f);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
  }).length;
  console.log(`Arquivos gerados em: ${compiledDir}`);
  console.log(`Total: ${fileCount} arquivos`);
}

// ============================================================================
// COMANDO: APPLY - GERAÇÃO DE CSS (Tailwind v4 + shadcn)
// ============================================================================

/**
 * Gera o conteúdo do globals.css compatível com Tailwind v4 + shadcn
 *
 * Estrutura esperada do brand.json:
 * {
 *   themes: {
 *     light/dark: {
 *       palette: { background, foreground, card, primary, secondary, muted, accent, border, input, ring }
 *       tokens: { card-foreground, popover, popover-foreground, ..., sidebar-*, chart-* }
 *       custom: { trace, info, highlight, success, warning, critical + foregrounds }
 *     }
 *   }
 * }
 */
function generateGlobalsCss(brand) {
  // Contextos para resolução de referências (estrutura direta do brand.json)
  const lightCtx = {
    palette: brand.themes.light.palette,
    tokens: brand.themes.light.tokens,
    custom: brand.themes.light.custom || {}
  };
  const darkCtx = {
    palette: brand.themes.dark.palette,
    tokens: brand.themes.dark.tokens,
    custom: brand.themes.dark.custom || {}
  };

  // Tokens da palette (cores base)
  const paletteTokens = [
    'background', 'foreground', 'card', 'primary', 'secondary', 'muted', 'accent', 'border', 'input', 'ring'
  ];

  // Tokens semânticos derivados
  const semanticTokens = [
    'card-foreground', 'popover', 'popover-foreground',
    'primary-foreground', 'secondary-foreground', 'muted-foreground', 'accent-foreground',
    'destructive', 'destructive-foreground',
    'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
    'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
    'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'
  ];

  // Tokens customizados (estados e feedback)
  const customTokens = [
    'trace', 'trace-foreground',
    'info', 'info-foreground',
    'highlight', 'highlight-foreground',
    'success', 'success-foreground',
    'warning', 'warning-foreground',
    'critical', 'critical-foreground'
  ];

  // Gera bloco de variáveis CSS
  const generateVars = (ctx, indent = '  ') => {
    const lines = [];

    // Radius
    lines.push(`${indent}--radius: 0.625rem;`);

    // Palette (cores base)
    for (const token of paletteTokens) {
      const value = ctx.palette[token];
      if (value) {
        lines.push(`${indent}--${token}: hsl(${resolveAndConvert(value, ctx)});`);
      }
    }

    // Tokens semânticos
    for (const token of semanticTokens) {
      const value = ctx.tokens[token];
      if (value) {
        lines.push(`${indent}--${token}: hsl(${resolveAndConvert(value, ctx)});`);
      }
    }

    // Tokens customizados
    const hasCustomTokens = customTokens.some(t => ctx.custom[t]);
    if (hasCustomTokens) {
      lines.push('');
      lines.push(`${indent}/* Custom tokens */`);
      for (const token of customTokens) {
        const value = ctx.custom[token];
        if (value) {
          lines.push(`${indent}--${token}: hsl(${resolveAndConvert(value, ctx)});`);
        }
      }
    }

    return lines.join('\n');
  };

  // Gera @theme inline (mapeamento Tailwind)
  const generateThemeInline = () => {
    const lines = [];

    // Todas as cores (palette + tokens + custom)
    const allTokens = [...paletteTokens, ...semanticTokens, ...customTokens];
    for (const token of allTokens) {
      lines.push(`  --color-${token}: var(--${token});`);
    }

    // Font
    lines.push('  --font-sans: var(--font-inter);');

    // Radius
    lines.push('  --radius-sm: calc(var(--radius) - 4px);');
    lines.push('  --radius-md: calc(var(--radius) - 2px);');
    lines.push('  --radius-lg: var(--radius);');
    lines.push('  --radius-xl: calc(var(--radius) + 4px);');
    lines.push('  --radius-2xl: calc(var(--radius) + 8px);');

    return lines.join('\n');
  };

  return `@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/* ==========================================================================
 * ${brand.title || 'Brand'} Theme
 * Generated by: brand.mjs apply
 * Source: specs/brand/${brand.brand}/brand.json
 * ========================================================================== */

@theme inline {
${generateThemeInline()}
}

:root {
${generateVars(lightCtx)}
}

.dark {
${generateVars(darkCtx)}
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;
}

function applyTheme(brandDir, appDir) {
  const brandJsonPath = path.join(brandDir, 'brand.json');

  if (!fs.existsSync(brandJsonPath)) {
    log.warning('brand.json não encontrado');
    return false;
  }

  log.step('Lendo brand.json...');

  let brand;
  try {
    const content = fs.readFileSync(brandJsonPath, 'utf8');
    brand = JSON.parse(content);
  } catch (err) {
    showErrorDialog('Erro ao ler brand.json', [
      'Não foi possível parsear o arquivo brand.json.',
      '',
      `Arquivo: ${brandJsonPath}`
    ], {
      details: [err.message],
      hint: 'Verifique se o JSON está válido (vírgulas, aspas, etc.)'
    });
    return false;
  }

  log.step('Gerando globals.css (Tailwind v4 + shadcn)...');

  let css;
  try {
    css = generateGlobalsCss(brand);
  } catch (err) {
    showErrorDialog('Erro ao gerar CSS', [
      'Falha ao processar o brand.json para gerar globals.css.',
      '',
      'Possíveis causas:',
      '  - Estrutura do JSON incorreta',
      '  - Tokens de cor faltando',
      '  - Referências inválidas ({token})'
    ], {
      details: [err.message, err.stack?.split('\n')[1]?.trim() || ''],
      hint: 'Verifique se brand.json segue o schema esperado.'
    });
    return false;
  }

  try {
    const globalsPath = path.join(appDir, 'globals.css');
    fs.writeFileSync(globalsPath, css, 'utf8');
    log.success(`globals.css atualizado: ${globalsPath}`);
  } catch (err) {
    showErrorDialog('Erro ao salvar globals.css', [
      'Não foi possível escrever o arquivo globals.css.',
      '',
      `Diretório: ${appDir}`
    ], {
      details: [err.message],
      hint: 'Verifique permissões de escrita no diretório.'
    });
    return false;
  }

  return true;
}

function applyAssets(brandDir, publicDir) {
  const compiledDir = path.join(brandDir, 'compiled');

  if (!fs.existsSync(compiledDir)) {
    showErrorDialog('Brand não compilado', [
      'O diretório compiled/ não existe.',
      '',
      `Esperado: ${compiledDir}`
    ], {
      hint: 'Execute primeiro: node brand.mjs compile <brand>'
    });
    return false;
  }

  log.step(`Copiando assets para ${publicDir}...`);

  // Função para copiar recursivamente
  const copyDir = (src, dest) => {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  try {
    // Copiar arquivos raiz
    for (const ext of ['ico', 'svg', 'png']) {
      for (const file of fs.readdirSync(compiledDir)) {
        if (file.endsWith(`.${ext}`)) {
          const srcPath = path.join(compiledDir, file);
          if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, path.join(publicDir, file));
          }
        }
      }
    }

    // Copiar subdiretórios
    copyDir(path.join(compiledDir, 'icons'), path.join(publicDir, 'icons'));
    copyDir(path.join(compiledDir, 'splash'), path.join(publicDir, 'splash'));
    copyDir(path.join(compiledDir, 'screenshots'), path.join(publicDir, 'screenshots'));
    copyDir(path.join(compiledDir, 'brand'), path.join(publicDir, 'brand'));
  } catch (err) {
    showErrorDialog('Erro ao copiar assets', [
      'Falha ao copiar arquivos para o diretório public.',
      '',
      `Origem: ${compiledDir}`,
      `Destino: ${publicDir}`
    ], {
      details: [err.message],
      hint: 'Verifique permissões e se os arquivos não estão em uso.'
    });
    return false;
  }

  log.success('Assets copiados!');
  return true;
}

function cmdApply(args) {
  let brandName = null;
  let themeOnly = false;
  let assetsOnly = false;

  // Parse arguments
  for (const arg of args) {
    if (arg === '-t' || arg === '--theme-only') {
      themeOnly = true;
    } else if (arg === '-a' || arg === '--assets-only') {
      assetsOnly = true;
    } else if (!arg.startsWith('-')) {
      brandName = arg;
    }
  }

  if (!brandName) {
    log.error('Uso: brand.mjs apply <brand> [-t|--theme-only] [-a|--assets-only]');
    process.exit(1);
  }

  if (themeOnly && assetsOnly) {
    log.error('Não pode usar --theme-only e --assets-only juntos');
    process.exit(1);
  }

  const brandsDir = findBrandsDir();
  if (!brandsDir) {
    log.error('Diretório specs/brand/ não encontrado');
    process.exit(1);
  }

  const brandDir = path.join(brandsDir, brandName);
  if (!fs.existsSync(brandDir)) {
    log.error(`Brand '${brandName}' não encontrado`);
    process.exit(1);
  }

  console.log('');
  log.info(`Aplicando brand: ${brandName}`);
  console.log('');

  let hasError = false;

  // Aplicar tema (cores)
  if (!assetsOnly) {
    const appDir = findAppDir();
    if (!appDir) {
      log.error('Diretório app/ não encontrado');
      process.exit(1);
    }
    if (!applyTheme(brandDir, appDir)) {
      hasError = true;
    }
  }

  // Aplicar assets (imagens)
  if (!themeOnly && !hasError) {
    const status = getBrandStatus(brandDir);
    if (status !== 'compiled') {
      log.warning('Brand não compilado, pulando assets');
      console.log(`Execute 'brand.mjs compile ${brandName}' para gerar assets`);
    } else {
      const publicDir = findPublicDir();
      if (!publicDir) {
        log.error('Diretório public/ não encontrado');
        process.exit(1);
      }
      if (!applyAssets(brandDir, publicDir)) {
        hasError = true;
      }
    }
  }

  if (hasError) {
    process.exit(1);
  }

  console.log('');
  log.success(`Brand '${brandName}' aplicado!`);

  if (themeOnly) {
    console.log('  (apenas tema/cores)');
  } else if (assetsOnly) {
    console.log('  (apenas assets)');
  }
}

// ============================================================================
// AJUDA
// ============================================================================

function showHelp() {
  console.log(`
${colors.bold('Brand Management Script')}

Gerencia múltiplos brands no projeto.

${colors.bold('Uso:')}
  node brand.mjs <command> [args]

${colors.bold('Comandos:')}
  list                       Lista brands com status (draft/compiled)
  compile <brand>            Compila SVGs → PNGs/ICO
  apply <brand> [flags]      Aplica brand (cores + assets)
  help                       Mostra esta ajuda

${colors.bold('Flags do apply:')}
  -t, --theme-only           Aplica apenas cores (CSS tokens)
  -a, --assets-only          Aplica apenas assets (icons, splash)

${colors.bold('Exemplos:')}
  node brand.mjs list              # Ver brands disponíveis
  node brand.mjs compile cia       # Gerar assets (favicons, icons, splash)
  node brand.mjs apply cia         # Aplicar tudo (cores + assets)
  node brand.mjs apply cia -t      # Aplicar apenas cores

${colors.bold('Estrutura do brand.json (shadcn-compatible):')}
  {
    "brand": "slug",
    "title": "Nome de Exibição",
    "description": "Descrição curta",
    "slogan": "Tagline",
    "themes": {
      "light": {
        "palette": {
          background, foreground, card, primary, secondary,
          muted, accent, border, input, ring
        },
        "tokens": {
          card-foreground, popover, popover-foreground,
          primary-foreground, secondary-foreground, muted-foreground, accent-foreground,
          destructive, destructive-foreground,
          sidebar, sidebar-foreground, sidebar-primary, sidebar-primary-foreground,
          sidebar-accent, sidebar-accent-foreground, sidebar-border, sidebar-ring,
          chart-1, chart-2, chart-3, chart-4, chart-5
        },
        "custom": {
          trace, trace-foreground, info, info-foreground,
          highlight, highlight-foreground, success, success-foreground,
          warning, warning-foreground, critical, critical-foreground
        }
      },
      "dark": { ... }
    }
  }

${colors.bold('Arquivos gerados pelo apply:')}
  globals.css    → CSS tokens (Tailwind v4 + shadcn)
  public/        → icons, splash, favicon, etc.

${colors.bold('Dependências (para compile):')}
  Opção 1 - CLIs externas:
    - rsvg-convert (librsvg) - SVG → PNG
    - magick (ImageMagick) - PNG → ICO
  Opção 2 - Node.js (fallback automático):
    - @resvg/resvg-js
    - png-to-ico
`);
}

// ============================================================================
// MAIN
// ============================================================================

const [,, command, ...args] = process.argv;

(async () => {
  switch (command) {
    case 'list':
      cmdList();
      break;
    case 'compile':
      await cmdCompile(args[0]);
      break;
    case 'apply':
      cmdApply(args);
      break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      showHelp();
      break;
    default:
      log.error(`Comando desconhecido: ${command}`);
      console.log("Use 'node brand.mjs help' para ver os comandos disponíveis.");
      process.exit(1);
  }
})();
