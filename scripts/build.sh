#!/usr/bin/env bash
set -e

echo "========================================================"
echo "  TaskFlow — Building C++ Engine and Java Application"
echo "========================================================"

# 1. Compile C++ Engine
echo "[1/4] Compiling C++ Task Engine..."
mkdir -p cpp-engine/build/bin
g++ -std=c++17 -O2 -I cpp-engine/include cpp-engine/src/task_engine.cpp cpp-engine/src/main.cpp -o cpp-engine/build/bin/task_engine
chmod +x cpp-engine/build/bin/task_engine
echo "[SUCCESS] C++ Engine binary created: cpp-engine/build/bin/task_engine"

# 2. Compile C++ Tests
echo "[2/4] Compiling C++ Test Suite..."
g++ -std=c++17 -O2 -I cpp-engine/include cpp-engine/src/task_engine.cpp cpp-engine/tests/test_engine.cpp -o cpp-engine/build/bin/test_engine
chmod +x cpp-engine/build/bin/test_engine
echo "[SUCCESS] C++ Test binary created: cpp-engine/build/bin/test_engine"

# 3. Compile Java Application
echo "[3/4] Compiling Java Application..."
mkdir -p java-app/bin
find java-app/src/main/java -name "*.java" > sources_main.txt
javac -encoding UTF-8 -d java-app/bin @sources_main.txt
rm sources_main.txt
echo "[SUCCESS] Java application classes compiled into java-app/bin"

# 4. Compile Java Tests
echo "[4/4] Compiling Java Test Suite..."
find java-app/src/test/java -name "*.java" > sources_test.txt
javac -encoding UTF-8 -cp java-app/bin -d java-app/bin @sources_test.txt
rm sources_test.txt
echo "[SUCCESS] Java test classes compiled."

echo "========================================================"
echo "  BUILD COMPLETED SUCCESSFULLY!"
echo "========================================================"
