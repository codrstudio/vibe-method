# PostgreSQL ANALYTICS Initialization Container
# Cria databases, schemas, extensoes e tabelas para base OLAP (modelo estrela)
FROM node:20-alpine

WORKDIR /app

# Copiar script de inicializacao
COPY scripts/init-postgres-analytics.mjs .

# Copiar migrations e seeds
COPY database/analytics/migrations ./migrations
COPY database/analytics/seeds ./seeds

# Instalar dependencia pg
RUN npm install --no-save pg

# Executar script
CMD ["node", "init-postgres-analytics.mjs"]
