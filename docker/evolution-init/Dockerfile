# Evolution API Initialization Container
# Cria instancia e configura webhook
FROM node:20-alpine

WORKDIR /app

# Copiar script de inicializacao
COPY scripts/init-evolution.mjs ./init-evolution.mjs

# Executar script
CMD ["node", "init-evolution.mjs"]
