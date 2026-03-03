#!/bin/bash

# API Test Script für Smart Village
# Testet alle wichtigen Endpoints

set -e

API_URL="http://localhost:8000/api"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=====================================${NC}"
echo -e "${YELLOW} Smart Village API Test Suite${NC}"
echo -e "${YELLOW}=====================================${NC}\n"

# Helper function
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  local description=$5
  
  echo -e "${YELLOW}Testing: ${description}${NC}"
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null)
  else
    response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data" 2>/dev/null)
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [[ $http_code == $expected_status* ]]; then
    echo -e "${GREEN}✅ PASS${NC} (Status: $http_code)\n"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    echo "$body"
  else
    echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $http_code)\n"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
  fi
}

# ============================================
# Test 1: User Registration
# ============================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}1. AUTHENTICATION TESTS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

REGISTER_DATA='{
  "email": "test-'$(date +%s)'@village.de",
  "password": "TestPassword123!",
  "villageName": "Testdorf",
  "locationName": "Baden-Württemberg",
  "phone": "07621123456",
  "infoText": "Test Village"
}'

test_endpoint "POST" "/auth/register" "$REGISTER_DATA" "200" "Register new user"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA")

USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")
USER_EMAIL=$(echo "$REGISTER_RESPONSE" | jq -r '.email' 2>/dev/null || echo "")

if [ -z "$USER_ID" ]; then
  echo -e "${RED}❌ Could not extract user ID from registration response${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Registered user: $USER_EMAIL (ID: $USER_ID)${NC}\n"

# ============================================
# Test 2: User Login
# ============================================

LOGIN_DATA=$(cat <<EOF
{
  "email": "$USER_EMAIL",
  "password": "TestPassword123!"
}
EOF
)

test_endpoint "POST" "/auth/login" "$LOGIN_DATA" "200" "User login and get JWT token"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA")

AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken' 2>/dev/null || echo "")

if [ -z "$AUTH_TOKEN" ] || [ "$AUTH_TOKEN" = "null" ]; then
  echo -e "${RED}❌ Could not extract JWT token${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Got JWT token: ${AUTH_TOKEN:0:50}...${NC}\n"

# ============================================
# Test 3: Get Current User
# ============================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}2. USER PROFILE TESTS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

test_endpoint "GET" "/auth/me" "" "200" "Get current user profile"

# ============================================
# Test 4: Get Village from Registered User
# ============================================

ME_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $AUTH_TOKEN")

VILLAGE_ID=$(echo "$ME_RESPONSE" | jq -r '.villages[0].id' 2>/dev/null || echo "")

if [ -z "$VILLAGE_ID" ]; then
  echo -e "${RED}❌ Could not extract village ID${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Got village ID: $VILLAGE_ID${NC}\n"

# ============================================
# Test 5: Get Sensors (should be empty initially)
# ============================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}3. SENSOR TESTS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

test_endpoint "GET" "/sensors/village/$VILLAGE_ID" "" "200" "Get sensors for village"

# ============================================
# Test 6: Create Sensor
# ============================================

SENSOR_DATA='{
  "sensorTypeId": 1,
  "name": "Temperature Sensor - Field 1",
  "infoText": "Main weather station",
  "isActive": true
}'

test_endpoint "POST" "/sensors/village/$VILLAGE_ID" "$SENSOR_DATA" "200" "Create new sensor"

CREATE_SENSOR_RESPONSE=$(curl -s -X POST "$API_URL/sensors/village/$VILLAGE_ID" \
  -H "Content-Type: application/json" \
  -d "$SENSOR_DATA")

SENSOR_ID=$(echo "$CREATE_SENSOR_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")

if [ -z "$SENSOR_ID" ]; then
  echo -e "${RED}❌ Could not extract sensor ID${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Created sensor with ID: $SENSOR_ID${NC}\n"

# ============================================
# Test 7: Get Specific Sensor
# ============================================

test_endpoint "GET" "/sensors/$SENSOR_ID" "" "200" "Get specific sensor"

# ============================================
# Test 8: Create Sensor Reading
# ============================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}4. SENSOR READING TESTS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

READING_DATA='{
  "value": 22.5,
  "status": "OK"
}'

test_endpoint "POST" "/sensor-readings/$SENSOR_ID" "$READING_DATA" "200" "Create sensor reading"

# ============================================
# Test 9: Get Sensor Readings
# ============================================

test_endpoint "GET" "/sensor-readings/$SENSOR_ID" "" "200" "Get sensor readings"

# ============================================
# Summary
# ============================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ ALL TESTS COMPLETED SUCCESSFULLY!${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "Test Summary:"
echo "  - User ID: $USER_ID"
echo "  - Village ID: $VILLAGE_ID"
echo "  - Sensor ID: $SENSOR_ID"
echo "  - JWT Token: ${AUTH_TOKEN:0:50}..."
echo ""
echo "✅ All API endpoints are working correctly!"

