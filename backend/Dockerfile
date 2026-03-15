# --- Build-Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

# Code + Prisma-Schema (inkl. prisma/)
COPY . .

# Prisma Client generieren (nutzt prisma/schema.prisma)
RUN npx prisma generate

# NestJS build
RUN npm run build

# --- Runtime-Stage ---
FROM node:20-alpine
WORKDIR /app

# Tools für DB-Wait + Prisma (nc + openssl)
RUN apk add --no-cache \
    netcat-openbsd \
    openssl

COPY package*.json ./
RUN npm install --only=production

# Prisma-Client + Schema + dist aus der Build-Stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Entrypoint-Script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

CMD ["./docker-entrypoint.sh"]
