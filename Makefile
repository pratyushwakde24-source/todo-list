.PHONY: all build build-cpp build-java test test-cpp test-java run clean

CXX ?= g++
CXXFLAGS = -std=c++17 -O2 -Wall -Wextra -I cpp-engine/include
JAVAC ?= javac
JAVA ?= java

all: build test

build: build-cpp build-java

build-cpp:
	@mkdir -p cpp-engine/build/bin
	$(CXX) $(CXXFLAGS) cpp-engine/src/task_engine.cpp cpp-engine/src/main.cpp -o cpp-engine/build/bin/task_engine
	$(CXX) $(CXXFLAGS) cpp-engine/src/task_engine.cpp cpp-engine/tests/test_engine.cpp -o cpp-engine/build/bin/test_engine
	@echo "[SUCCESS] C++ binaries built in cpp-engine/build/bin"

build-java:
	@mkdir -p java-app/bin
	find java-app/src/main/java -name "*.java" > sources_main.txt
	$(JAVAC) -encoding UTF-8 -d java-app/bin @sources_main.txt
	@rm sources_main.txt
	find java-app/src/test/java -name "*.java" > sources_test.txt
	$(JAVAC) -encoding UTF-8 -cp java-app/bin -d java-app/bin @sources_test.txt
	@rm sources_test.txt
	@echo "[SUCCESS] Java classes compiled into java-app/bin"

test: test-cpp test-java

test-cpp: build-cpp
	@echo "--- Running C++ Test Suite ---"
	./cpp-engine/build/bin/test_engine

test-java: build-java
	@echo "--- Running Java Test Suite ---"
	$(JAVA) -cp java-app/bin com.taskflow.TaskServiceTest

run: build
	@mkdir -p data
	$(JAVA) -cp java-app/bin com.taskflow.Main

clean:
	rm -rf cpp-engine/build java-app/bin
	@echo "Cleaned build artifacts."
