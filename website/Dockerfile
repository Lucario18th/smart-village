FROM node:20-alpine

WORKDIR /app

# 1. Dependencies
COPY package*.json ./
RUN npm ci

# 2. Quellcode
COPY . .

# 3. Build-Ziel-Verzeichnis = Volume-Pfad aus docker-compose
ENV BUILD_DIR=/usr/share/nginx/html

# 4. Beim Container-Start: Build nach /usr/share/nginx/html schreiben
CMD ["sh", "-c", "npm run build && rm -rf $BUILD_DIR/* && cp -r dist/* $BUILD_DIR/"]
