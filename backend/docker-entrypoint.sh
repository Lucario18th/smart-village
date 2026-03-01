#!/bin/sh
set -e

# DB wartet ggf. noch -> optional kleines Sleep oder healthcheck später
echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting NestJS..."
node dist/main.js
