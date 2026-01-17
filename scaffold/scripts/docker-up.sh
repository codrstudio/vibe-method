#!/bin/bash
# docker-up.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Opcoes
BUILD=false
WATCH=false

show_help() {
    echo "Uso: $0 [OPCOES]"
    echo ""
    echo "Levanta os containers Docker do projeto."
    echo ""
    echo "Opcoes:"
    echo "  -b, --build    Faz down, build e up do container"
    echo "  -w, --watch    Roda em modo console (sem daemon)"
    echo "  -h, --help     Exibe esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0             Roda em modo daemon se nao estiver rodando"
    echo "  $0 -b          Para, compila e roda em modo daemon"
    echo "  $0 -b -w       Para, compila e roda em modo console"
    echo "  $0 -w          Para e roda em modo console"
    echo ""
    echo "Configuracao:"
    echo "  O script detecta ENVIRONMENT no .env e usa o compose correto:"
    echo "    - development  -> docker-compose.dev.yml"
    echo "    - staging      -> docker-compose.staging.yml"
    echo "    - production   -> docker-compose.yml"
}

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--build)
            BUILD=true
            shift
            ;;
        -w|--watch)
            WATCH=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Opcao desconhecida: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Ir para diretorio do projeto
cd "$PROJECT_DIR"

# Detectar ambiente
if [[ -f .env ]]; then
    ENVIRONMENT=$(grep -E "^ENVIRONMENT=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
fi

# Definir arquivo compose baseado no ambiente
case "${ENVIRONMENT:-development}" in
    production)
        COMPOSE_FILE="docker-compose.yml"
        ;;
    staging)
        COMPOSE_FILE="docker-compose.staging.yml"
        ;;
    development|*)
        COMPOSE_FILE="docker-compose.dev.yml"
        ;;
esac

echo -e "${GREEN}Ambiente:${NC} ${ENVIRONMENT:-development}"
echo -e "${GREEN}Compose:${NC} $COMPOSE_FILE"

# Verificar se arquivo existe
if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo -e "${RED}Erro: Arquivo $COMPOSE_FILE nao encontrado${NC}"
    exit 1
fi

# Executar comandos baseado nas opcoes
if [[ "$BUILD" == true ]]; then
    echo -e "${YELLOW}Parando containers...${NC}"
    docker compose -f "$COMPOSE_FILE" down

    echo -e "${YELLOW}Compilando containers...${NC}"
    docker compose -f "$COMPOSE_FILE" build

    if [[ "$WATCH" == true ]]; then
        echo -e "${GREEN}Iniciando em modo console...${NC}"
        docker compose -f "$COMPOSE_FILE" up
    else
        echo -e "${GREEN}Iniciando em modo daemon...${NC}"
        docker compose -f "$COMPOSE_FILE" up -d
    fi
elif [[ "$WATCH" == true ]]; then
    echo -e "${YELLOW}Parando containers...${NC}"
    docker compose -f "$COMPOSE_FILE" down

    echo -e "${GREEN}Iniciando em modo console...${NC}"
    docker compose -f "$COMPOSE_FILE" up
else
    # Verificar se ja esta rodando
    RUNNING=$(docker compose -f "$COMPOSE_FILE" ps -q 2>/dev/null | wc -l)

    if [[ "$RUNNING" -gt 0 ]]; then
        echo -e "${GREEN}Containers ja estao rodando${NC}"
        docker compose -f "$COMPOSE_FILE" ps
    else
        echo -e "${GREEN}Iniciando em modo daemon...${NC}"
        docker compose -f "$COMPOSE_FILE" up -d
    fi
fi
