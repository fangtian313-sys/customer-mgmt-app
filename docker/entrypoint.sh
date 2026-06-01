#!/bin/bash
set -e

# Ensure static files directory exists
mkdir -p /app/static

# Add static file serving to main.py if not already present
if ! grep -q "StaticFiles" /app/app/main.py; then
  cat >> /app/app/main.py << 'PYEOF'

# Static file serving and SPA fallback
import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve index.html for all non-API routes (SPA fallback)."""
        file_path = static_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        index_path = static_dir / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        return JSONResponse(status_code=404, content={"detail": "Not found"})
PYEOF
fi

# Initialize database if it doesn't exist
if [ ! -f /app/data/customer_mgmt.db ]; then
    mkdir -p /app/data
    cd /app && python -c "
import sys
sys.path.insert(0, '/app')
from app.database import engine, Base
Base.metadata.create_all(bind=engine)
print('Database initialized')
"
fi

# Start the application
cd /app
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
