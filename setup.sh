#!/usr/bin/env bash
# ============================================================
#  HMS — Hospital Management System
#  Full Auto-Setup Script
#  Usage: bash setup.sh
# ============================================================

set -e

# ── Colors ────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
info() { echo -e "${CYAN}→${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
err()  { echo -e "${RED}✗${NC} $1"; }
step() { echo -e "\n${BOLD}${BLUE}[$1]${NC} $2"; }

echo ""
echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║   🏥  HMS — Hospital Management System           ║${NC}"
echo -e "${BOLD}${BLUE}║       Automated Setup Script                     ║${NC}"
echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── Detect OS ─────────────────────────────────────────────
OS="$(uname -s)"
case "$OS" in
  Linux*)  PLATFORM="linux" ;;
  Darwin*) PLATFORM="mac" ;;
  CYGWIN*|MINGW*|MSYS*) PLATFORM="windows" ;;
  *) PLATFORM="unknown" ;;
esac
ok "Detected platform: $PLATFORM"

# ── Check Python ──────────────────────────────────────────
step "1/7" "Checking Python installation"

PYTHON=""
for cmd in python3.12 python3 python; do
  if command -v "$cmd" &>/dev/null; then
    VER=$($cmd -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null)
    MAJOR=$(echo "$VER" | cut -d. -f1)
    MINOR=$(echo "$VER" | cut -d. -f2)
    if [ "$MAJOR" -ge 3 ] && [ "$MINOR" -ge 10 ]; then
      PYTHON="$cmd"
      ok "Python $VER found at $(command -v $cmd)"
      break
    fi
  fi
done

if [ -z "$PYTHON" ]; then
  err "Python 3.10+ is required but not found."
  echo ""
  if [ "$PLATFORM" = "linux" ]; then
    echo "  Install with:"
    echo "    sudo apt update && sudo apt install python3 python3-venv python3-pip"
  elif [ "$PLATFORM" = "mac" ]; then
    echo "  Install with:"
    echo "    brew install python"
  else
    echo "  Download from: https://python.org/downloads"
  fi
  exit 1
fi

# ── Check pip ─────────────────────────────────────────────
if ! $PYTHON -m pip --version &>/dev/null; then
  err "pip not found. Installing..."
  if [ "$PLATFORM" = "linux" ]; then
    sudo apt install python3-pip -y 2>/dev/null || true
  fi
  $PYTHON -m ensurepip --upgrade 2>/dev/null || true
fi
ok "pip available"

# ── Navigate to backend ───────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

if [ ! -d "$BACKEND_DIR" ]; then
  err "backend/ directory not found. Make sure you're running this from the hms/ root."
  exit 1
fi

# ── Create virtual environment ────────────────────────────
step "2/7" "Creating Python virtual environment"

cd "$BACKEND_DIR"

if [ -d ".venv" ]; then
  warn ".venv already exists — skipping creation"
else
  $PYTHON -m venv .venv
  ok "Virtual environment created at backend/.venv"
fi

# Activate venv
if [ "$PLATFORM" = "windows" ]; then
  VENV_ACTIVATE=".venv/Scripts/activate"
else
  VENV_ACTIVATE=".venv/bin/activate"
fi

source "$VENV_ACTIVATE"
ok "Virtual environment activated"

# ── Install dependencies ──────────────────────────────────
step "3/7" "Installing Python dependencies"

pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
ok "All dependencies installed"

# Verify critical packages
$PYTHON -c "import fastapi, motor, bcrypt, jose, pydantic, dotenv" 2>/dev/null \
  && ok "All packages verified" \
  || { err "Package verification failed. Run: pip install -r requirements.txt"; exit 1; }

# ── Setup .env ────────────────────────────────────────────
step "4/7" "Configuring environment variables"

if [ -f ".env" ]; then
  warn "backend/.env already exists — skipping"
else
  cp .env.example .env
  ok "Created backend/.env from template"

  # Auto-generate JWT_SECRET
  JWT_SECRET=$($PYTHON -c "import secrets; print(secrets.token_hex(32))")
  if [ "$PLATFORM" = "mac" ]; then
    sed -i '' "s|JWT_SECRET=replace-with-a-strong-random-secret-key|JWT_SECRET=$JWT_SECRET|" .env
  else
    sed -i "s|JWT_SECRET=replace-with-a-strong-random-secret-key|JWT_SECRET=$JWT_SECRET|" .env
  fi
  ok "Auto-generated JWT_SECRET"
fi

# ── Collect MongoDB URI ───────────────────────────────────
step "5/7" "MongoDB Atlas configuration"

# Check if MONGO_DETAILS is already set and not a placeholder
CURRENT_MONGO=$(grep "^MONGO_DETAILS=" .env | cut -d= -f2-)
if echo "$CURRENT_MONGO" | grep -q "<username>\|<password>\|<cluster>"; then
  echo ""
  echo -e "  ${YELLOW}You need a MongoDB Atlas connection string.${NC}"
  echo "  Get it from: https://cloud.mongodb.com"
  echo "  → Cluster → Connect → Drivers → Python → Copy URI"
  echo ""
  echo -n "  Paste your MongoDB URI here: "
  read -r MONGO_URI

  if [ -z "$MONGO_URI" ]; then
    warn "No URI entered. You must set MONGO_DETAILS in backend/.env manually before starting."
  else
    if [ "$PLATFORM" = "mac" ]; then
      sed -i '' "s|MONGO_DETAILS=.*|MONGO_DETAILS=$MONGO_URI|" .env
    else
      sed -i "s|MONGO_DETAILS=.*|MONGO_DETAILS=$MONGO_URI|" .env
    fi
    ok "MongoDB URI saved"

    # Test connection
    info "Testing MongoDB connection..."
    $PYTHON -c "
import asyncio, os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
load_dotenv()
async def test():
    try:
        c = AsyncIOMotorClient(os.getenv('MONGO_DETAILS'), serverSelectionTimeoutMS=8000)
        await c.admin.command('ping')
        print('CONNECTED')
    except Exception as e:
        print(f'FAILED: {e}')
asyncio.run(test())
" | grep -q "CONNECTED" \
      && ok "MongoDB connection successful" \
      || warn "MongoDB connection test failed — check your URI and network access settings"
  fi
else
  ok "MongoDB URI already configured"
fi

# ── Set Admin Code ────────────────────────────────────────
step "6/7" "Admin registration code"

CURRENT_CODE=$(grep "^HMS_ADMIN_CODE=" .env | cut -d= -f2-)
echo ""
echo -e "  Current admin code: ${YELLOW}$CURRENT_CODE${NC}"
echo -n "  Press Enter to keep it, or type a new code: "
read -r NEW_CODE

if [ -n "$NEW_CODE" ]; then
  if [ "$PLATFORM" = "mac" ]; then
    sed -i '' "s|HMS_ADMIN_CODE=.*|HMS_ADMIN_CODE=$NEW_CODE|" .env
  else
    sed -i "s|HMS_ADMIN_CODE=.*|HMS_ADMIN_CODE=$NEW_CODE|" .env
  fi
  ok "Admin code updated to: $NEW_CODE"
else
  ok "Keeping admin code: $CURRENT_CODE"
fi

# ── Create launch scripts ─────────────────────────────────
step "7/7" "Creating launch scripts"

cd "$SCRIPT_DIR"

# start_backend.sh
cat > start_backend.sh << 'BACKEND_SCRIPT'
#!/usr/bin/env bash
cd "$(dirname "$0")/backend"
source .venv/bin/activate
echo "🏥 Starting HMS Backend on http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Press Ctrl+C to stop"
echo ""
uvicorn main:app --reload --host 127.0.0.1 --port 8000
BACKEND_SCRIPT
chmod +x start_backend.sh
ok "Created start_backend.sh"

# start_frontend.sh
cat > start_frontend.sh << 'FRONTEND_SCRIPT'
#!/usr/bin/env bash
cd "$(dirname "$0")/frontend"
echo "🌐 Starting HMS Frontend on http://localhost:5500"
echo "   Open: http://localhost:5500/login.html"
echo "   Press Ctrl+C to stop"
echo ""
python3 -m http.server 5500
FRONTEND_SCRIPT
chmod +x start_frontend.sh
ok "Created start_frontend.sh"

# start.sh — launches both in background with logs
cat > start.sh << 'START_SCRIPT'
#!/usr/bin/env bash
# Starts both backend and frontend, shows combined logs
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "🏥 Starting HMS — Hospital Management System"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start backend
cd "$SCRIPT_DIR/backend"
source .venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
echo "✓ Backend started (PID $BACKEND_PID) → http://localhost:8000"

# Wait for backend to be ready
sleep 2

# Start frontend
cd "$SCRIPT_DIR/frontend"
python3 -m http.server 5500 &
FRONTEND_PID=$!
echo "✓ Frontend started (PID $FRONTEND_PID) → http://localhost:5500"

echo ""
echo "  Open: http://localhost:5500/login.html"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Trap Ctrl+C and kill both
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
START_SCRIPT
chmod +x start.sh
ok "Created start.sh (launches both servers)"

# ── Done ──────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║   ✅  Setup Complete!                            ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}To start the app:${NC}"
echo ""
echo -e "  ${CYAN}Option A — Single command (both servers):${NC}"
echo "    bash start.sh"
echo ""
echo -e "  ${CYAN}Option B — Separate terminals:${NC}"
echo "    Terminal 1:  bash start_backend.sh"
echo "    Terminal 2:  bash start_frontend.sh"
echo ""
echo -e "  ${CYAN}Then open:${NC}"
echo "    http://localhost:5500/login.html"
echo ""
echo -e "  ${CYAN}Register accounts:${NC}"
echo "    Patient  → no code needed"
echo "    Doctor   → no code needed"
ADMIN_CODE_FINAL=$(grep "^HMS_ADMIN_CODE=" "$BACKEND_DIR/.env" | cut -d= -f2-)
echo "    Admin    → use code: $ADMIN_CODE_FINAL"
echo ""
echo -e "  ${CYAN}API Docs (Swagger UI):${NC}"
echo "    http://localhost:8000/docs"
echo ""
