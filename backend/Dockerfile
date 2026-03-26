# --- Build-Stage ---
FROM node:20 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Code + Prisma-Schema (inkl. prisma/)
COPY . .

# Prisma Client generieren (nutzt prisma/schema.prisma)
RUN npx prisma generate

# NestJS build
RUN npm run build

# --- Runtime-Stage ---
FROM node:20
WORKDIR /app

# Tools für DB-Wait + Prisma (nc + openssl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    netcat-openbsd \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

# Prisma-Client + Schema + dist aus der Build-Stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Prisma-Client auf Runtime-Umgebung finalisieren (musl/openssl target)
RUN npx prisma generate

# Entrypoint-Script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER node

CMD ["./docker-entrypoint.sh"]
