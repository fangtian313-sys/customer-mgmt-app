#!/usr/bin/env bash
set -e

echo "==> Building frontend..."
cd frontend
npm ci --prefer-offline
npm run build
cd ..

echo "==> Installing backend dependencies..."
cd backend
pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo "==> Build complete!"
