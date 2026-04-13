@echo off
:: ============================================================
:: HMS — Hospital Management System — Windows Setup Script
:: Usage: Double-click setup.bat  OR  run from Command Prompt
:: ============================================================

title HMS Setup

echo.
echo  ==========================================
echo   HMS — Hospital Management System Setup
echo  ==========================================
echo.

:: ── Check Python ─────────────────────────────────────────
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python not found.
    echo  Install Python 3.12+ from https://python.org
    echo  Make sure to check "Add Python to PATH" during install.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"') do set PY_VERSION=%%i
echo  [OK] Python %PY_VERSION% found

:: ── Backend setup ─────────────────────────────────────────
echo.
echo  [*] Setting up backend...
cd backend

:: Create venv if missing
if not exist ".venv" (
    echo  [*] Creating virtual environment...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo  [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

:: Activate venv
call .venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo  [ERROR] Failed to activate virtual environment.
    pause
    exit /b 1
)

:: Install dependencies
echo  [*] Installing dependencies...
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo  [ERROR] pip install failed. Check your internet connection.
    pause
    exit /b 1
)
echo  [OK] Dependencies installed

:: Create .env if missing
if not exist ".env" (
    copy .env.example .env >nul
    echo.
    echo  [!] Created backend\.env from template.
    echo  [!] You MUST edit backend\.env before starting:
    echo.
    echo      MONGO_DETAILS  = your MongoDB Atlas connection URI
    echo      JWT_SECRET     = run this to generate one:
    echo                       python -c "import secrets; print(secrets.token_hex(32))"
    echo      HMS_ADMIN_CODE = secret code for admin registration
    echo.
) else (
    echo  [OK] backend\.env already exists
)

cd ..

:: ── Done ──────────────────────────────────────────────────
echo.
echo  [OK] Setup complete!
echo.
echo  ==================================================
echo   Next steps:
echo.
echo   1. Edit backend\.env with your MongoDB URI
echo      and secrets (if not done already)
echo.
echo   2. Start the BACKEND — open a new Command Prompt:
echo      cd backend
echo      .venv\Scripts\activate
echo      uvicorn main:app --reload
echo.
echo   3. Start the FRONTEND — open another Command Prompt:
echo      cd frontend
echo      python -m http.server 5500
echo.
echo   4. Open in your browser:
echo      http://localhost:5500/login.html
echo.
echo   5. Register accounts:
echo      Patient  - no code needed
echo      Doctor   - no code needed
echo      Admin    - enter HMS_ADMIN_CODE from your .env
echo  ==================================================
echo.
pause
