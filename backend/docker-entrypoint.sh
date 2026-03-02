#!/bin/sh
set -e

echo "Starting NestJS (without Prisma migrations)..."
node dist/main.js
