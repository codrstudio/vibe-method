# PostgreSQL MAIN Initialization Container
# Cria databases, schemas, extensoes, tabelas e seeds para base transacional
FROM node:20-alpine

WORKDIR /app

# Copiar script de inicializacao
COPY scripts/init-postgres-main.mjs .

# Copiar migrations e seeds
COPY database/main/migrations ./migrations
COPY database/main/seeds ./seeds

# Instalar dependencia pg
RUN npm install --no-save pg

# Executar script
CMD ["node", "init-postgres-main.mjs"]
