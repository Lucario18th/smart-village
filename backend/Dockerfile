FROM node:20-alpine AS builder
WORKDIR /app

# deps
COPY package*.json ./
RUN npm install

# source
COPY . .

# Prisma Client bauen
RUN npx prisma generate

# Nest build
RUN npm run build

# --- Runtime-Image ---
FROM node:20-alpine
WORKDIR /app

# nur was nötig ist
COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Entry-Script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

CMD ["./docker-entrypoint.sh"]
