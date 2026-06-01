#!/bin/bash
set -e

# Ensure static files directory exists
mkdir -p /app/static

# Start the application (database auto-initializes on import)
cd /app
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
