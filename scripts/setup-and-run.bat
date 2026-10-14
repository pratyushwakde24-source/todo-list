@echo off
echo ========================================================
echo   TaskFlow — One-Click Setup & Launch
echo ========================================================

call scripts\build.bat
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build step failed. Check output above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Launching TaskFlow desktop application...
call scripts\run.bat
