#!/bin/bash

function check_response() {
    local response="$1"
    local expected="$2"
    local message="$3"

    if [[ "$response" != *"$expected"* ]]; then
        echo "ERROR: $message"
        echo "Expected to find: $expected"
        echo "Received: $response"
        # exit 1
    else
        echo "SUCCESS: $message"
    fi
}

# Fetching metrics
echo "Fetching metrics..."
response=$(curl -s http://localhost:8000/metrics)
check_response "$response" "" "Fetching metrics"

# Listing all databases in file storage
echo "Listing all databases in file storage..."
response=$(curl -s http://localhost:8000/file)
check_response "$response" '{"state":"ok","data":[]}' "Listing all databases in file storage"

# Listing all databases in memory storage
echo "Listing all databases in memory storage..."
response=$(curl -s http://localhost:8000/memory)
check_response "$response" '{"state":"ok","data":[]}' "Listing all databases in memory storage"

# Listing tables in 'exampleDB' database (file storage)
echo "Listing tables in 'exampleDB' database (file storage)..."
response=$(curl -s http://localhost:8000/file/exampleDB)
check_response "$response" '{"state":"err","errmsg":"database not exists.","errcode":"HJDB-002"}' "Listing tables in 'exampleDB' (file storage)"

# Listing tables in 'exampleDB' database (memory storage)
echo "Listing tables in 'exampleDB' database (memory storage)..."
response=$(curl -s http://localhost:8000/memory/exampleDB)
check_response "$response" '{"state":"err","errmsg":"database not exists.","errcode":"HJDB-002"}' "Listing tables in 'exampleDB' (memory storage)"

# Querying 'users' table in 'exampleDB' (file storage)
echo "Querying 'users' table in 'exampleDB' (file storage)..."
response=$(curl -s http://localhost:8000/file/exampleDB/users)
check_response "$response" "ExpectedQueryResultFile" "Querying 'users' table (file storage)"

# Querying 'users' table in 'exampleDB' (memory storage)
echo "Querying 'users' table in 'exampleDB' (memory storage)..."
response=$(curl -s http://localhost:8000/memory/exampleDB/users)
check_response "$response" "ExpectedQueryResultMemory" "Querying 'users' table (memory storage)"

# Updating 'users' table in 'exampleDB' (file storage)
echo "Updating 'users' table in 'exampleDB' (file storage)..."
response=$(curl -s -X POST http://localhost:8000/file/exampleDB/users -H "Content-Type: application/json" -d '{"name": "John Doe", "age": 30}')
check_response "$response" '{"state":"ok"}' "Updating 'users' table (file storage)"

# Updating 'users' table in 'exampleDB' (memory storage)
echo "Updating 'users' table in 'exampleDB' (memory storage)..."
response=$(curl -s -X POST http://localhost:8000/memory/exampleDB/users -H "Content-Type: application/json" -d '{"name": "Jane Doe", "age": 25}')
check_response "$response" "ExpectedUpdateResultMemory" "Updating 'users' table (memory storage)"

# Deleting from 'users' table in 'exampleDB' (file storage)
echo "Deleting from 'users' table in 'exampleDB' (file storage)..."
response=$(curl -s -X DELETE http://localhost:8000/file/exampleDB/users)
check_response "$response" '{"state":"ok"}' "Deleting from 'users' table (file storage)"

# Deleting from 'users' table in 'exampleDB' (memory storage)
echo "Deleting from 'users' table in 'exampleDB' (memory storage)..."
response=$(curl -s -X DELETE http://localhost:8000/memory/exampleDB/users)
check_response "$response" '{"state":"ok"} "Deleting from 'users' table (memory storage)"


