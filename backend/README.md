# ORBIT HR System - Backend (FastAPI)

This repository is a minimal, ready-to-run FastAPI backend for the ORBIT HR System MVP.
It implements:

<!-- - PostgreSQL async SQLAlchemy models matching the SQL schema -->

- JWT authentication (access + refresh) with single-active-session enforcement
- Basic routers for auth, users, attendances, candidates
- SMTP helper (configurable) to send recruitment emails and log them

Requirements:

- Python 3.11+
- PostgreSQL (local)
- Redis

Redis setup:

- macOS (Homebrew):

  1. brew update
  2. brew install redis
  3. brew services start redis   # auto-run in background at login
  4. Verify: redis-cli ping  (should return PONG)

- Linux (Ubuntu/Debian):

  1. sudo apt update
  2. sudo apt install -y redis-server
  3. sudo systemctl enable redis-server
  4. sudo systemctl start redis-server
  5. Verify: redis-cli ping  (should return PONG)

- Windows:

  - Option 1 (winget + Docker):
    1. winget install Docker.Docker
    2. docker run -d --name redis -p 6379:6379 --restart unless-stopped redis:7
    3. Verify: docker exec -it redis redis-cli ping (PONG)

  - Option 2 (Chocolatey service):
    1. choco install redis-64
    2. net start Redis
    3. Verify: redis-cli ping (PONG)

Notes:

- The backend reads `REDIS_URL` (default `redis://localhost:6379`).
- If Redis runs on a different host/port (or via Docker), set `.env`:

  REDIS_URL=redis://localhost:6379

Quickstart (local):

1. git clone <repo>
2. python -m venv .venv
3. source .venv/Scripts/activate
4. pip install -r requirements.txt
5. copy .env.example -> .env and set values (DATABASE*URL, SECRET_KEY, SMTP*\*)

<!-- 5. Run migrations: (for MVP you can let SQLAlchemy create tables)
from Python shell: python -c "from app.db import init_db; import asyncio; asyncio.run(init_db())" -->
6. Start API:
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
