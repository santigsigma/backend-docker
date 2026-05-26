#!/bin/bash

# Colors para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_HOST="http://localhost"
API_PORT=${1:-8080}
API_URL="$API_HOST:$API_PORT"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Testing Backend API${NC}"
echo -e "${BLUE}URL: $API_URL${NC}"
echo -e "${BLUE}================================${NC}\n"

# Función para hacer requests
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4

  echo -e "${YELLOW}[TEST] $description${NC}"
  echo -e "${BLUE}$method $endpoint${NC}"
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
      -H "Content-Type: application/json")
  else
    echo -e "${BLUE}Data: $data${NC}"
    response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | head -n -1)

  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✓ Status: $http_code${NC}"
  else
    echo -e "${RED}✗ Status: $http_code${NC}"
  fi

  echo "Response:"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  echo -e "\n"
}

# Test 1: Health Check
test_endpoint "GET" "/health" "" "Health Check (sin BD)"

# Test 2: DB Status
test_endpoint "GET" "/db-status" "" "DB Status (con consulta BD)"

# Test 3: Get Items (vacío)
test_endpoint "GET" "/items" "" "Listar Items (inicial)"

# Test 4: Create Item
test_endpoint "POST" "/items" '{"nombre":"Item de Prueba"}' "Crear nuevo Item"

# Test 5: Get Items (con item creado)
test_endpoint "GET" "/items" "" "Listar Items (con datos)"

# Test 6: Create otro item
test_endpoint "POST" "/items" '{"nombre":"Segundo Item de Test"}' "Crear segundo Item"

# Test 7: Get Items final
test_endpoint "GET" "/items" "" "Listar Items (final)"

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}✓ Tests completados${NC}"
echo -e "${BLUE}================================${NC}"
