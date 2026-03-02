#!/bin/sh
set -e

echo "Waiting for database smartvillage-postgres:5432..."
until nc -z smartvillage-postgres 5432; do
  sleep 1
done

echo "Running Prisma migrations (deploy)..."
npx prisma migrate deploy

echo "Starting NestJS..."
node dist/main.js
