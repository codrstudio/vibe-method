# Ollama Initialization Container
# Puxa modelos conforme config de hardware
FROM node:20-alpine

WORKDIR /app

# Copiar script de inicializacao
COPY scripts/init-ollama.mjs ./init-ollama.mjs

# Copiar config de modelos
COPY config/ollama-models.json ./config/ollama-models.json

# Executar script
CMD ["node", "init-ollama.mjs"]
