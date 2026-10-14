@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   TaskFlow — Building C++ Engine and Java Application
echo ========================================================

:: 1. Check C++ Compiler (g++ or clang++)
echo [1/4] Checking for C++ compiler...
where g++ >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set CXX=g++
    echo Found g++ compiler.
) else (
    where clang++ >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        set CXX=clang++
        echo Found clang++ compiler.
    ) else (
        echo [ERROR] No C++ compiler found (g++ or clang++). Please install MinGW-w64 or Visual Studio C++ tools.
        exit /b 1
    )
)

:: 2. Check Java Compiler (javac)
echo [2/4] Checking for Java JDK (javac)...
where javac >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] javac compiler not found! Please install JDK 17 or later and add it to your PATH.
    exit /b 1
)
javac -version

:: 3. Compile C++ Standalone Engine
echo [3/4] Compiling C++ Task Engine...
if not exist "cpp-engine\build\bin" mkdir "cpp-engine\build\bin"
%CXX% -std=c++17 -O2 -I cpp-engine/include cpp-engine/src/task_engine.cpp cpp-engine/src/main.cpp -o cpp-engine/build/bin/task_engine.exe
if %ERRORLEVEL% neq 0 (
    echo [ERROR] C++ Engine compilation failed!
    exit /b %ERRORLEVEL%
)
echo [SUCCESS] C++ Engine binary created: cpp-engine\build\bin\task_engine.exe

:: Also compile test executable
%CXX% -std=c++17 -O2 -I cpp-engine/include cpp-engine/src/task_engine.cpp cpp-engine/tests/test_engine.cpp -o cpp-engine/build/bin/test_engine.exe
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] C++ Test binary created: cpp-engine\build\bin\test_engine.exe
)

:: 4. Compile Java Application
echo [4/4] Compiling Java Swing Application...
if not exist "java-app\bin" mkdir "java-app\bin"
dir /s /b java-app\src\main\java\*.java > sources_main.txt
javac -encoding UTF-8 -d java-app\bin @sources_main.txt
set JAVAC_STATUS=%ERRORLEVEL%
del sources_main.txt

if %JAVAC_STATUS% neq 0 (
    echo [ERROR] Java compilation failed!
    exit /b %JAVAC_STATUS%
)
echo [SUCCESS] Java application classes compiled into: java-app\bin

:: Compile Java Tests
dir /s /b java-app\src\test\java\*.java > sources_test.txt 2>nul
if exist sources_test.txt (
    javac -encoding UTF-8 -cp java-app\bin -d java-app\bin @sources_test.txt
    del sources_test.txt
    echo [SUCCESS] Java test classes compiled.
)

echo.
echo ========================================================
echo   BUILD COMPLETED SUCCESSFULLY!
echo   Run 'scripts\run.bat' to launch TaskFlow.
echo ========================================================
