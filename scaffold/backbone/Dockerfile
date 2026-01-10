# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY *.ts ./
COPY agents ./agents
COPY db ./db
COPY jobs ./jobs
COPY nodes ./nodes
COPY services ./services
COPY tools ./tools
COPY workflows ./workflows

RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist

# Copy runtime assets
COPY prompts ./prompts
COPY templates ./templates

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

CMD ["node", "dist/index.js"]
