FROM node:20-alpine

WORKDIR /app

# 1. Dependencies
COPY package*.json ./
RUN npm ci

# 2. Quellcode
COPY . .

# 3. Build
RUN npm run build

# 4. Finale Stage mit nginx für Production
FROM node:20-alpine
WORKDIR /app

# Nur den dist Ordner für den Build
COPY --from=0 /app/dist /usr/share/nginx/html/
