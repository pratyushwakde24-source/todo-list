cmake_minimum_required(VERSION 3.10)
project(TaskFlowEngine VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

# Core library
add_library(task_engine_lib src/task_engine.cpp)

# Standalone Executable
add_executable(task_engine src/main.cpp)
target_link_libraries(task_engine PRIVATE task_engine_lib)

# Test Executable
add_executable(test_engine tests/test_engine.cpp)
target_link_libraries(test_engine PRIVATE task_engine_lib)

# Output directory
set_target_properties(task_engine PROPERTIES RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")
set_target_properties(test_engine PROPERTIES RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")
