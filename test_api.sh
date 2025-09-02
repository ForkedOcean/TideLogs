#!/bin/bash

# TideLogs API Testing Script

API_URL="http://localhost:8080"

echo "🌊 TideLogs API Testing Script"
echo "==============================="

# Function to check if API is available
check_api() {
    echo "Checking if API is available..."
    if curl -s "$API_URL/health" > /dev/null 2>&1; then
        echo "✅ API is running"
    else
        echo "❌ API is not available. Make sure the backend is running."
        exit 1
    fi
}

# Function to send test logs
send_test_logs() {
    echo ""
    echo "📝 Sending test logs..."

    # Test log 1: Info level
    echo "Sending INFO log..."
    curl -X POST "$API_URL/logs" \
        -H "Content-Type: application/json" \
        -d '{
            "service": "test-service",
            "level": "INFO",
            "message": "Test application started successfully",
            "metadata": {"version": "1.0.0", "environment": "test"}
        }' -w "\nStatus: %{http_code}\n"

    # Test log 2: Error level
    echo "Sending ERROR log..."
    curl -X POST "$API_URL/logs" \
        -H "Content-Type: application/json" \
        -d '{
            "service": "test-service",
            "level": "ERROR",
            "message": "Database connection failed",
            "metadata": {"error_code": "DB_CONN_TIMEOUT", "retry_count": 3}
        }' -w "\nStatus: %{http_code}\n"

    # Test log 3: Warning level
    echo "Sending WARN log..."
    curl -X POST "$API_URL/logs" \
        -H "Content-Type: application/json" \
        -d '{
            "service": "cache-service",
            "level": "WARN",
            "message": "Cache hit ratio below threshold",
            "metadata": {"hit_ratio": 0.65, "threshold": 0.8}
        }' -w "\nStatus: %{http_code}\n"
}

# Function to retrieve logs
retrieve_logs() {
    echo ""
    echo "📊 Retrieving logs..."

    # Get all logs
    echo "Getting all logs (limited to 5):"
    curl -s "$API_URL/logs?limit=5" | jq '.'

    echo ""
    echo "Getting ERROR level logs:"
    curl -s "$API_URL/logs?level=ERROR&limit=3" | jq '.'

    echo ""
    echo "Getting logs from test-service:"
    curl -s "$API_URL/logs?service=test-service&limit=3" | jq '.'
}

# Main execution
main() {
    check_api
    send_test_logs
    retrieve_logs

    echo ""
    echo "🎉 Testing completed!"
    echo "Visit http://localhost:3000 to view the dashboard"
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq is not installed. JSON responses will not be formatted."
    echo "Install jq for better output: sudo apt-get install jq (Ubuntu) or brew install jq (macOS)"
fi

main