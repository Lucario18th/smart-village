# 1. Build-Stage
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_MAILHOG_URL=https://localhost:8025
ENV VITE_MAILHOG_URL=${VITE_MAILHOG_URL}
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build   # erzeugt /app/dist

# 2. Runtime-Stage: Nginx mit React-Build
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
