@echo off
echo ========================================================
echo   Launching TaskFlow — Smart To-Do Manager
echo ========================================================

:: Verify compiled classes exist
if not exist "java-app\bin\com\taskflow\Main.class" (
    echo [ERROR] Compiled Java classes not found in java-app\bin.
    echo Please run 'scripts\build.bat' first!
    pause
    exit /b 1
)

:: Ensure data directory exists
if not exist "data" mkdir "data"

:: Launch Java Swing Application
java -cp "java-app\bin" com.taskflow.Main %*
