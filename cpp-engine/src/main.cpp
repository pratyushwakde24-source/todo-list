#include "../include/task_engine.h"
#include <iostream>
#include <string>

int main(int argc, char* argv[]) {
    // Check if arguments were supplied for single-shot execution
    if (argc > 1) {
        std::string arg1 = argv[1];
        if (arg1 == "--ping" || arg1 == "-p") {
            std::cout << taskflow::TaskEngine::processJsonCommand("{\"action\":\"PING\"}") << std::endl;
            return 0;
        }
        if (arg1 == "--json" && argc > 2) {
            std::cout << taskflow::TaskEngine::processJsonCommand(argv[2]) << std::endl;
            return 0;
        }
        if (arg1 == "--help" || arg1 == "-h") {
            std::cout << "TaskFlow C++ Task Processing Engine 1.0\n"
                      << "Usage:\n"
                      << "  task_engine               # Start interactive stdin/stdout JSON IPC loop\n"
                      << "  task_engine --ping        # Test engine health and return JSON status\n"
                      << "  task_engine --json <RAW>  # Process a single JSON command payload\n";
            return 0;
        }
    }

    // Default: Standard I/O IPC stream loop for Java ProcessBuilder
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        if (line == "EXIT" || line == "QUIT") {
            break;
        }
        std::string response = taskflow::TaskEngine::processJsonCommand(line);
        std::cout << response << std::endl;
        std::cout.flush();
    }

    return 0;
}
