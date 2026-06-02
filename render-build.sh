#!/usr/bin/env bash
set -e

# Fix read-only filesystem for Cargo (needed by pydantic-core/maturin)
export CARGO_HOME="/tmp/cargo"
mkdir -p "$CARGO_HOME"

echo "==> Building frontend..."
cd frontend
npm ci --prefer-offline
npm run build
cd ..

echo "==> Installing backend dependencies..."
cd backend
pip install --upgrade pip
pip install --only-binary=:all: -r requirements.txt || pip install -r requirements.txt
cd ..

echo "==> Build complete!"
