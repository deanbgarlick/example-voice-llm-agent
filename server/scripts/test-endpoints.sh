#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper function to make requests and check responses
test_endpoint() {
    local endpoint=$1
    local method=$2
    local payload=$3
    local description=$4

    echo -e "\n🧪 Testing: $description"
    echo "Endpoint: $endpoint"
    echo "Method: $method"
    
    if [ -n "$payload" ]; then
        echo "Payload: $payload"
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$payload")
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint")
    fi

    if [ -n "$response" ]; then
        echo -e "${GREEN}✓ Response received:${NC}"
        echo "$response" | json_pp
    else
        echo -e "${RED}✗ No response received${NC}"
    fi
}

echo "🚀 Starting API endpoint tests..."

# Test health endpoint
test_endpoint "/health" "GET" "" "Health Check"

# Test products endpoints
test_endpoint "/api/products" "GET" "" "Get All Products"
test_endpoint "/api/products?random=true" "GET" "" "Get Random Products"
test_endpoint "/api/products?query=fruit" "GET" "" "Search Products"

# Test session endpoint
test_endpoint "/api/session" "POST" '{
    "model": "gpt-4o-realtime-preview-2024-12-17",
    "voice": "alloy",
    "modalities": ["audio", "text"]
}' "Create Session"

# Test orders endpoint
test_endpoint "/api/orders" "POST" '{
    "items": [{
        "product": {
            "_id": "65f4a8f25f95f3f89c85c5d1",
            "title": "Test Product"
        },
        "quantity": 1
    }],
    "address": "123 Test St"
}' "Create Order"

echo -e "\n✨ API endpoint tests completed"
