#!/bin/bash
# docker-down.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

show_help() {
    echo "Uso: $0 [OPCOES]"
    echo ""
    echo "Para os containers Docker do projeto."
    echo ""
    echo "Opcoes:"
    echo "  -h, --help     Exibe esta ajuda"
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

# Verificar se esta rodando
RUNNING=$(docker compose -f "$COMPOSE_FILE" ps -q 2>/dev/null | wc -l)

if [[ "$RUNNING" -eq 0 ]]; then
    echo -e "${YELLOW}Containers ja estao parados${NC}"
else
    echo -e "${YELLOW}Parando containers...${NC}"
    docker compose -f "$COMPOSE_FILE" down
    echo -e "${GREEN}Containers parados${NC}"
fi
