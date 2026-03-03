#!/bin/bash

# Docker Commands Reference für Smart Village

echo "Smart Village - Docker Commands Reference"
echo "=========================================="
echo ""

echo "# 📦 BUILD & RUN"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "## Start all containers (build if needed)"
echo "cd /home/leon/smart-village/infra && docker compose up -d --build"
echo ""

echo "## Start containers (no rebuild)"
echo "cd /home/leon/smart-village/infra && docker compose up -d"
echo ""

echo "## Stop all containers"
echo "cd /home/leon/smart-village/infra && docker compose down"
echo ""

echo "## Stop containers and remove volumes"
echo "cd /home/leon/smart-village/infra && docker compose down -v"
echo ""

echo ""
echo "# 📋 STATUS & LOGS"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "## Show running containers"
echo "cd /home/leon/smart-village/infra && docker compose ps"
echo ""

echo "## Show all containers (including stopped)"
echo "cd /home/leon/smart-village/infra && docker compose ps -a"
echo ""

echo "## View logs for a service"
echo "cd /home/leon/smart-village/infra && docker compose logs smartvillage-backend"
echo ""

echo "## Follow logs in real-time"
echo "cd /home/leon/smart-village/infra && docker compose logs -f smartvillage-backend"
echo ""

echo "## View last 50 lines of logs"
echo "cd /home/leon/smart-village/infra && docker compose logs --tail=50 smartvillage-backend"
echo ""

echo ""
echo "# 🧪 TESTING"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "## Run backend unit tests"
echo "cd /home/leon/smart-village/backend && npm test"
echo ""

echo "## Run backend tests with coverage"
echo "cd /home/leon/smart-village/backend && npm run test:cov"
echo ""

echo "## Run linter"
echo "cd /home/leon/smart-village/backend && npm run lint"
echo ""

echo "## Run API tests"
echo "bash /home/leon/smart-village/docker-test-report/scripts/test-api.sh"
echo ""

echo ""
echo "# 🔧 DATABASE"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "## Access PostgreSQL shell"
echo "cd /home/leon/smart-village/infra && docker compose exec smartvillage-postgres psql -U smartvillage -d smartvillage"
echo ""

echo "## Run Prisma migrations"
echo "cd /home/leon/smart-village/backend && npm run prisma:migrate:deploy"
echo ""

echo "## Run Prisma seeding"
echo "cd /home/leon/smart-village/backend && npm run prisma:seed"
echo ""

echo "## Check migrations status"
echo "cd /home/leon/smart-village/backend && npm run prisma -- migrate status"
echo ""

echo ""
echo "# 🔍 DEBUGGING"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "## Execute command in running container"
echo "docker compose exec smartvillage-backend ls -la"
echo ""

echo "## Get container shell"
echo "docker compose exec smartvillage-backend sh"
echo ""

echo "## Check container resource usage"
echo "docker stats"
echo ""

echo "## View container details"
echo "docker compose inspect smartvillage-backend"
echo ""

echo ""
echo "# 🚀 API TESTING"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "## Register new user"
echo "curl -X POST http://localhost:8000/api/auth/register \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{ \"email\": \"test@village.de\", \"password\": \"Test1234!\", \"villageName\": \"Testdorf\", \"locationName\": \"Region\" }'"
echo ""

echo "## Login user"
echo "curl -X POST http://localhost:8000/api/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{ \"email\": \"test@village.de\", \"password\": \"Test1234!\" }'"
echo ""

echo "## Get user profile (needs Bearer token)"
echo "curl -X GET http://localhost:8000/api/auth/me \\"
echo "  -H 'Authorization: Bearer TOKEN_HERE'"
echo ""

echo "## Create sensor"
echo "curl -X POST http://localhost:8000/api/sensors/village/1 \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{ \"sensorTypeId\": 1, \"name\": \"Temperature Sensor\", \"infoText\": \"Field 1\" }'"
echo ""

echo "## Get sensors for village"
echo "curl -X GET http://localhost:8000/api/sensors/village/1"
echo ""

echo ""
echo "# 🔐 SSL/CERTIFICATES"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "## Test HTTPS (ignore self-signed cert)"
echo "curl -k https://localhost/"
echo ""

echo "## View certificate info"
echo "openssl x509 -in /opt/smartvillage/certs/nginx-selfsigned.crt -text -noout"
echo ""

echo ""
echo "# 📊 MONITORING"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "## Check disk usage of volumes"
echo "docker volume ls"
echo ""

echo "## Remove unused volumes"
echo "docker volume prune"
echo ""

echo "## Remove all unused images, containers, volumes"
echo "docker system prune -a"
echo ""

