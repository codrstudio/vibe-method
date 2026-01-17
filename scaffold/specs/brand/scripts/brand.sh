#!/usr/bin/env bash
# Brand Management Script
# Gerencia múltiplos brands: list, compile, select
# Uso: ./brand.sh <command> [args]

set -euo pipefail

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR" && pwd)"

# Detectar diretório de brands (specs/brand/ do projeto que usa o método)
# O script pode ser chamado de qualquer lugar, então procuramos specs/brand/
find_brands_dir() {
    local current="$PWD"

    # Procura specs/brand/ subindo na hierarquia
    while [[ "$current" != "/" ]]; do
        if [[ -d "$current/specs/brand" ]]; then
            echo "$current/specs/brand"
            return 0
        fi
        current="$(dirname "$current")"
    done

    # Se não encontrou, usa o diretório atual + specs/brand
    if [[ -d "$PWD/specs/brand" ]]; then
        echo "$PWD/specs/brand"
        return 0
    fi

    return 1
}

# Detectar diretório public/ do projeto
find_public_dir() {
    local current="$PWD"

    while [[ "$current" != "/" ]]; do
        # Monorepo: apps/app/public/
        if [[ -d "$current/apps/app/public" ]]; then
            echo "$current/apps/app/public"
            return 0
        fi
        # Projeto simples: public/
        if [[ -d "$current/public" ]]; then
            echo "$current/public"
            return 0
        fi
        current="$(dirname "$current")"
    done

    return 1
}

# ============================================================================
# CORES E FORMATAÇÃO
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

print_error() { echo -e "${RED}✗ $1${NC}" >&2; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_step() { echo -e "${CYAN}→ $1${NC}"; }

# ============================================================================
# DEPENDÊNCIAS
# ============================================================================

check_dependencies() {
    local missing=()

    if ! command -v rsvg-convert &> /dev/null; then
        missing+=("rsvg-convert (librsvg)")
    fi

    if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
        missing+=("magick/convert (ImageMagick)")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        print_error "Dependências faltando:"
        for dep in "${missing[@]}"; do
            echo "  - $dep"
        done
        echo ""
        echo "Instalação:"
        echo "  macOS:  brew install librsvg imagemagick"
        echo "  Ubuntu: apt install librsvg2-bin imagemagick"
        echo "  Windows (MSYS2): pacman -S mingw-w64-x86_64-librsvg mingw-w64-x86_64-imagemagick"
        return 1
    fi

    return 0
}

# Wrapper para ImageMagick (magick ou convert)
im_convert() {
    if command -v magick &> /dev/null; then
        magick "$@"
    else
        convert "$@"
    fi
}

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

# Lista brands (pastas com positioned/)
list_brands() {
    local brands_dir="$1"
    local brands=()

    for dir in "$brands_dir"/*/; do
        local name="$(basename "$dir")"
        # Ignora blueprint e diretórios sem positioned/
        if [[ "$name" != "blueprint" && "$name" != "scripts" && -d "$dir/positioned" ]]; then
            brands+=("$name")
        fi
    done

    echo "${brands[@]}"
}

# Verifica status do brand
get_brand_status() {
    local brand_dir="$1"

    if [[ ! -d "$brand_dir/compiled" ]]; then
        echo "draft"
        return
    fi

    # Verifica se compiled/ tem arquivos
    local file_count=$(find "$brand_dir/compiled" -type f 2>/dev/null | wc -l)
    if [[ $file_count -eq 0 ]]; then
        echo "draft"
    else
        echo "compiled"
    fi
}

# Verifica se brand está selecionado
is_brand_selected() {
    local brands_dir="$1"
    local brand_name="$2"
    local pointer_file="$brands_dir/current-brand.json"

    if [[ -f "$pointer_file" ]]; then
        # Extrai valor de "current" do JSON
        local selected=$(grep -o '"current"[[:space:]]*:[[:space:]]*"[^"]*"' "$pointer_file" | sed 's/.*"current"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/')
        if [[ "$selected" == "$brand_name" ]]; then
            return 0
        fi
    fi

    return 1
}

# ============================================================================
# TAMANHOS DE SPLASH iOS
# ============================================================================

declare -a SPLASH_SIZES=(
    "750x1334"    # iPhone SE/8
    "1170x2532"   # iPhone 12-14
    "1179x2556"   # iPhone 14/15 Pro
    "1284x2778"   # iPhone Pro Max
    "1290x2796"   # iPhone 14/15 Pro Max
    "1320x2868"   # iPhone 16 Pro Max
    "1536x2048"   # iPad
    "1668x2388"   # iPad Pro 11"
    "2048x2732"   # iPad Pro 12.9"
)

# ============================================================================
# COMANDO: LIST
# ============================================================================

cmd_list() {
    local brands_dir
    if ! brands_dir=$(find_brands_dir); then
        print_error "Diretório specs/brand/ não encontrado"
        return 1
    fi

    local brands=($(list_brands "$brands_dir"))

    if [[ ${#brands[@]} -eq 0 ]]; then
        print_warning "Nenhum brand encontrado em $brands_dir"
        echo ""
        echo "Para criar um brand:"
        echo "  1. Copie blueprint/ para specs/brand/<nome>/"
        echo "  2. Adicione seus SVGs em positioned/"
        return 0
    fi

    echo ""
    echo -e "${BOLD}Brands encontrados:${NC}"
    echo ""

    for brand in "${brands[@]}"; do
        local brand_dir="$brands_dir/$brand"
        local status=$(get_brand_status "$brand_dir")
        local selected=""

        if is_brand_selected "$brands_dir" "$brand"; then
            selected="${CYAN}(selecionado)${NC}"
        fi

        local status_color=""
        if [[ "$status" == "compiled" ]]; then
            status_color="${GREEN}$status${NC}"
        else
            status_color="${YELLOW}$status${NC}"
        fi

        printf "  ${BOLD}%-15s${NC} %-12b %b\n" "$brand" "$status_color" "$selected"
    done

    echo ""
}

# ============================================================================
# COMANDO: COMPILE
# ============================================================================

# Converte SVG para PNG
svg_to_png() {
    local input="$1"
    local output="$2"
    local width="$3"
    local height="${4:-$width}"

    rsvg-convert -w "$width" -h "$height" -o "$output" "$input"
}

# Gera favicon.ico a partir de SVG
generate_favicon_ico() {
    local input_svg="$1"
    local output_ico="$2"
    local temp_dir="$3"

    # Gera múltiplos tamanhos
    local sizes=(16 32 48)
    local png_files=()

    for size in "${sizes[@]}"; do
        local png_file="$temp_dir/favicon-${size}.png"
        svg_to_png "$input_svg" "$png_file" "$size"
        png_files+=("$png_file")
    done

    # Combina em ICO
    im_convert "${png_files[@]}" "$output_ico"
}

# Encontra arquivo com fallback (suporta múltiplos nomes)
# Uso: find_asset "$theme_dir" "icon.svg" "icon-square.svg"
find_asset() {
    local dir="$1"
    shift
    for name in "$@"; do
        if [[ -f "$dir/$name" ]]; then
            echo "$dir/$name"
            return 0
        fi
    done
    return 1
}

# Processa tema (light ou dark)
process_theme() {
    local positioned_dir="$1"
    local compiled_dir="$2"
    local theme="$3"
    local temp_dir="$4"

    local suffix=""
    if [[ "$theme" == "dark" ]]; then
        suffix="-dark"
    fi

    local theme_dir="$positioned_dir/$theme"

    if [[ ! -d "$theme_dir" ]]; then
        print_warning "Tema $theme não encontrado em positioned/"
        return 0
    fi

    local asset_file

    # -------------------------------------------------------------------------
    # ICON → favicons, PWA icons
    # Aceita: icon.svg ou icon-square.svg
    # -------------------------------------------------------------------------
    if asset_file=$(find_asset "$theme_dir" "icon.svg" "icon-square.svg"); then
        print_step "Processando $(basename "$asset_file") ($theme)"

        # Apenas light gera favicon.svg e favicon.ico
        if [[ "$theme" == "light" ]]; then
            cp "$asset_file" "$compiled_dir/favicon.svg"
            generate_favicon_ico "$asset_file" "$compiled_dir/favicon.ico" "$temp_dir"

            # Apple Touch Icon
            svg_to_png "$asset_file" "$compiled_dir/apple-touch-icon.png" 180
        fi

        # PWA icons
        svg_to_png "$asset_file" "$compiled_dir/icons/icon-192${suffix}.png" 192
        svg_to_png "$asset_file" "$compiled_dir/icons/icon-512${suffix}.png" 512
    fi

    # -------------------------------------------------------------------------
    # ICON-MASKABLE → maskable PWA icons
    # Aceita: icon-maskable.svg ou icon-square-maskable.svg
    # -------------------------------------------------------------------------
    if asset_file=$(find_asset "$theme_dir" "icon-maskable.svg" "icon-square-maskable.svg"); then
        print_step "Processando $(basename "$asset_file") ($theme)"

        svg_to_png "$asset_file" "$compiled_dir/icons/icon-192-maskable${suffix}.png" 192
        svg_to_png "$asset_file" "$compiled_dir/icons/icon-512-maskable${suffix}.png" 512
    fi

    # -------------------------------------------------------------------------
    # BRAND → brand SVGs
    # Aceita: brand-square.svg ou logotype.svg
    # Saída: brand/logotype.svg e brand/logotype-squared.svg
    # -------------------------------------------------------------------------
    if asset_file=$(find_asset "$theme_dir" "brand-square.svg" "logotype.svg"); then
        print_step "Processando $(basename "$asset_file") ($theme)"
        cp "$asset_file" "$compiled_dir/brand/logotype${suffix}.svg"
        cp "$asset_file" "$compiled_dir/brand/logotype-squared${suffix}.svg"
    fi

    # -------------------------------------------------------------------------
    # SPLASH → splash screens
    # Aceita: creative-square.svg ou splash-artwork.svg
    # -------------------------------------------------------------------------
    if asset_file=$(find_asset "$theme_dir" "creative-square.svg" "splash-artwork.svg"); then
        print_step "Processando $(basename "$asset_file") ($theme)"

        for size in "${SPLASH_SIZES[@]}"; do
            local width="${size%x*}"
            local height="${size#*x}"
            svg_to_png "$asset_file" "$compiled_dir/splash/splash-${size}${suffix}.png" "$width" "$height"
        done
    fi

    # -------------------------------------------------------------------------
    # OG-IMAGE → Open Graph images
    # Aceita: creative-social.svg ou og-image.svg
    # -------------------------------------------------------------------------
    if asset_file=$(find_asset "$theme_dir" "creative-social.svg" "og-image.svg"); then
        print_step "Processando $(basename "$asset_file") ($theme)"
        svg_to_png "$asset_file" "$compiled_dir/og-image${suffix}.png" 1200 630
    fi
}

# Processa assets neutros
process_neutral() {
    local positioned_dir="$1"
    local compiled_dir="$2"

    local neutral_dir="$positioned_dir/neutral"

    if [[ ! -d "$neutral_dir" ]]; then
        return 0
    fi

    # -------------------------------------------------------------------------
    # SCREENSHOTS
    # -------------------------------------------------------------------------
    if [[ -f "$neutral_dir/screenshot-wide.svg" ]]; then
        print_step "Processando screenshot-wide.svg"
        svg_to_png "$neutral_dir/screenshot-wide.svg" "$compiled_dir/screenshots/screenshot-wide.png" 1280 720
    fi

    if [[ -f "$neutral_dir/screenshot-narrow.svg" ]]; then
        print_step "Processando screenshot-narrow.svg"
        svg_to_png "$neutral_dir/screenshot-narrow.svg" "$compiled_dir/screenshots/screenshot-narrow.png" 390 844
    fi
}

cmd_compile() {
    local brand_name="$1"

    if [[ -z "$brand_name" ]]; then
        print_error "Uso: brand.sh compile <brand>"
        return 1
    fi

    local brands_dir
    if ! brands_dir=$(find_brands_dir); then
        print_error "Diretório specs/brand/ não encontrado"
        return 1
    fi

    local brand_dir="$brands_dir/$brand_name"

    if [[ ! -d "$brand_dir" ]]; then
        print_error "Brand '$brand_name' não encontrado"
        echo "Brands disponíveis:"
        for b in $(list_brands "$brands_dir"); do
            echo "  - $b"
        done
        return 1
    fi

    if [[ ! -d "$brand_dir/positioned" ]]; then
        print_error "Brand '$brand_name' não tem pasta positioned/"
        return 1
    fi

    # Verificar dependências
    if ! check_dependencies; then
        return 1
    fi

    print_info "Compilando brand: $brand_name"
    echo ""

    local positioned_dir="$brand_dir/positioned"
    local compiled_dir="$brand_dir/compiled"

    # Criar diretório temporário
    local temp_dir=$(mktemp -d)
    trap "rm -rf $temp_dir" EXIT

    # Limpar e criar estrutura de compiled/
    rm -rf "$compiled_dir"
    mkdir -p "$compiled_dir"/{icons,splash,screenshots,brand}

    # Processar temas
    process_theme "$positioned_dir" "$compiled_dir" "light" "$temp_dir"
    process_theme "$positioned_dir" "$compiled_dir" "dark" "$temp_dir"

    # Processar neutros
    process_neutral "$positioned_dir" "$compiled_dir"

    echo ""
    print_success "Brand '$brand_name' compilado com sucesso!"
    echo ""
    echo "Arquivos gerados em: $compiled_dir"

    # Listar arquivos gerados
    local file_count=$(find "$compiled_dir" -type f | wc -l)
    echo "Total: $file_count arquivos"
}

# ============================================================================
# COMANDO: SELECT
# ============================================================================

cmd_select() {
    local brand_name="$1"

    if [[ -z "$brand_name" ]]; then
        print_error "Uso: brand.sh select <brand>"
        return 1
    fi

    local brands_dir
    if ! brands_dir=$(find_brands_dir); then
        print_error "Diretório specs/brand/ não encontrado"
        return 1
    fi

    local brand_dir="$brands_dir/$brand_name"

    if [[ ! -d "$brand_dir" ]]; then
        print_error "Brand '$brand_name' não encontrado"
        return 1
    fi

    local status=$(get_brand_status "$brand_dir")
    if [[ "$status" != "compiled" ]]; then
        print_error "Brand '$brand_name' não está compilado"
        echo "Execute primeiro: brand.sh compile $brand_name"
        return 1
    fi

    local public_dir
    if ! public_dir=$(find_public_dir); then
        print_error "Diretório public/ não encontrado"
        echo "Certifique-se de estar em um projeto com public/ ou apps/app/public/"
        return 1
    fi

    print_info "Selecionando brand: $brand_name"
    print_step "Destino: $public_dir"
    echo ""

    local compiled_dir="$brand_dir/compiled"

    # Copiar arquivos
    cp -v "$compiled_dir"/*.ico "$public_dir/" 2>/dev/null || true
    cp -v "$compiled_dir"/*.svg "$public_dir/" 2>/dev/null || true
    cp -v "$compiled_dir"/*.png "$public_dir/" 2>/dev/null || true

    # Copiar subdiretórios
    if [[ -d "$compiled_dir/icons" ]]; then
        mkdir -p "$public_dir/icons"
        cp -rv "$compiled_dir/icons/"* "$public_dir/icons/"
    fi

    if [[ -d "$compiled_dir/splash" ]]; then
        mkdir -p "$public_dir/splash"
        cp -rv "$compiled_dir/splash/"* "$public_dir/splash/"
    fi

    if [[ -d "$compiled_dir/screenshots" ]]; then
        mkdir -p "$public_dir/screenshots"
        cp -rv "$compiled_dir/screenshots/"* "$public_dir/screenshots/"
    fi

    if [[ -d "$compiled_dir/brand" ]]; then
        mkdir -p "$public_dir/brand"
        cp -rv "$compiled_dir/brand/"* "$public_dir/brand/"
    fi

    # Marcar como selecionado em current-brand.json
    printf '{\n  "current": "%s"\n}\n' "$brand_name" > "$brands_dir/current-brand.json"

    echo ""
    print_success "Brand '$brand_name' selecionado!"
    echo "Assets copiados para: $public_dir"
}

# ============================================================================
# AJUDA
# ============================================================================

show_help() {
    echo ""
    echo -e "${BOLD}Brand Management Script${NC}"
    echo ""
    echo "Gerencia múltiplos brands no projeto."
    echo ""
    echo -e "${BOLD}Uso:${NC}"
    echo "  brand.sh <command> [args]"
    echo ""
    echo -e "${BOLD}Comandos:${NC}"
    echo "  list              Lista brands com status (draft/compiled)"
    echo "  compile <brand>   Compila SVGs → PNGs/ICO"
    echo "  select <brand>    Copia compiled/ → public/"
    echo "  help              Mostra esta ajuda"
    echo ""
    echo -e "${BOLD}Exemplos:${NC}"
    echo "  brand.sh list"
    echo "  brand.sh compile minha-marca"
    echo "  brand.sh select minha-marca"
    echo ""
    echo -e "${BOLD}Estrutura esperada:${NC}"
    echo "  specs/brand/<brand>/positioned/"
    echo "    ├── light/     (icon-square.svg, icon-square-maskable.svg, brand-square.svg, ...)"
    echo "    ├── dark/      (mesmos arquivos para tema escuro)"
    echo "    └── neutral/   (screenshot-wide.svg, screenshot-narrow.svg)"
    echo ""
    echo -e "${BOLD}Arquivos suportados:${NC}"
    echo "  icon.svg ou icon-square.svg            → favicon, PWA icons"
    echo "  icon-maskable.svg ou icon-square-maskable.svg → maskable icons"
    echo "  brand-square.svg ou logotype.svg       → brand SVGs"
    echo "  creative-square.svg ou splash-artwork.svg → splash screens"
    echo "  creative-social.svg ou og-image.svg    → Open Graph image"
    echo ""
    echo -e "${BOLD}Dependências:${NC}"
    echo "  - rsvg-convert (librsvg) - SVG → PNG"
    echo "  - magick (ImageMagick) - PNG → ICO"
    echo ""
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    local command="${1:-}"

    case "$command" in
        list)
            cmd_list
            ;;
        compile)
            cmd_compile "${2:-}"
            ;;
        select)
            cmd_select "${2:-}"
            ;;
        help|--help|-h)
            show_help
            ;;
        "")
            show_help
            ;;
        *)
            print_error "Comando desconhecido: $command"
            echo "Use 'brand.sh help' para ver os comandos disponíveis."
            exit 1
            ;;
    esac
}

main "$@"
