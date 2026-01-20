# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage - use nginx to serve static files
FROM nginx:alpine

# Copy built files to nginx (Vite builds to /app/wa/ because of base config)
COPY --from=builder /app/dist /usr/share/nginx/html/app/wa

# Copy nginx config for SPA routing under /app/wa
RUN echo 'server { \
    listen 8004; \
    root /usr/share/nginx/html; \
    \
    location /app/wa/ { \
        alias /usr/share/nginx/html/app/wa/; \
        try_files $uri $uri/ /app/wa/index.html; \
    } \
    \
    location / { \
        return 301 /app/wa/; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 8004

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
