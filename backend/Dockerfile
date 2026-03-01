# --- Build-Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# 1) package.json + lockfile
COPY package*.json ./

RUN npm install

# 2) Code + Prisma-Schema
COPY . .

# Prisma Client explizit bauen
RUN npx prisma generate

# Nest build
RUN npm run build


# --- Runtime-Stage ---
FROM node:20-alpine
WORKDIR /app

# 1) package.json + lockfile
COPY package*.json ./

# 2) nur Prod-Dependencies
RUN npm install --only=production

# 3) Prisma-Client und Schema aus Build-Stage übernehmen
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# 4) Entry-Script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

CMD ["./docker-entrypoint.sh"]
