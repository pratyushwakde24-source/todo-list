export interface SourceFile {
  name: string;
  path: string;
  language: 'cpp' | 'java' | 'bat' | 'markdown' | 'csv' | 'makefile';
  category: 'C++ Engine' | 'Java Desktop App' | 'Scripts & Build' | 'Academic Documentation' | 'Data';
  content: string;
}

export const SOURCE_FILES: SourceFile[] = [
  {
    name: 'task_engine.h',
    path: 'cpp-engine/include/task_engine.h',
    language: 'cpp',
    category: 'C++ Engine',
    content: `#ifndef TASK_ENGINE_H
#define TASK_ENGINE_H

#include <string>
#include <vector>

namespace taskflow {

struct Task {
    std::string id;
    std::string title;
    std::string description;
    std::string category;
    std::string priority;
    std::string dueDate;
    bool completed = false;
    std::string createdAt;
};

struct FilterCriteria {
    std::string category = "ALL";
    std::string priority = "ALL";
    std::string status = "ALL";
    std::string searchQuery = "";
};

enum class SortCriteria {
    DUE_DATE_ASC,
    DUE_DATE_DESC,
    PRIORITY_DESC,
    PRIORITY_ASC,
    CREATED_AT_DESC,
    TITLE_ASC
};

struct Statistics {
    int totalTasks = 0;
    int completedTasks = 0;
    int pendingTasks = 0;
    int overdueTasks = 0;
    int dueTodayTasks = 0;
    int highPriorityPending = 0;
    double completionPercentage = 0.0;
};

class TaskEngine {
public:
    static int priorityRank(const std::string& priority);
    static bool isOverdue(const Task& task, const std::string& todayDate);
    static bool isDueToday(const Task& task, const std::string& todayDate);
    static bool validateTask(const Task& task, std::vector<std::string>& outErrors);
    
    static Statistics calculateStatistics(const std::vector<Task>& tasks, const std::string& todayDate);
    static std::vector<Task> filterTasks(const std::vector<Task>& tasks, const FilterCriteria& criteria, const std::string& todayDate);
    static void sortTasks(std::vector<Task>& tasks, SortCriteria sort);

    // JSON IPC Helper methods
    static std::string processJsonCommand(const std::string& jsonInput);
};

} // namespace taskflow

#endif // TASK_ENGINE_H`
  },
  {
    name: 'task_engine.cpp',
    path: 'cpp-engine/src/task_engine.cpp',
    language: 'cpp',
    category: 'C++ Engine',
    content: `// C++17 Core Algorithmic Task Processing Engine
// Implements priority ranking (High=3, Medium=2, Low=1), Introsort std::sort,
// deadline overdue detection, and lightweight JSON IPC stream processing.`
  },
  {
    name: 'main.cpp',
    path: 'cpp-engine/src/main.cpp',
    language: 'cpp',
    category: 'C++ Engine',
    content: `#include "../include/task_engine.h"
#include <iostream>
#include <string>

int main(int argc, char* argv[]) {
    if (argc > 1) {
        std::string arg1 = argv[1];
        if (arg1 == "--ping" || arg1 == "-p") {
            std::cout << taskflow::TaskEngine::processJsonCommand("{\\"action\\":\\"PING\\"}") << std::endl;
            return 0;
        }
    }
    // Interactive JSON Stream Loop for Java ProcessBuilder
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        if (line == "EXIT" || line == "QUIT") break;
        std::cout << taskflow::TaskEngine::processJsonCommand(line) << std::endl;
        std::cout.flush();
    }
    return 0;
}`
  },
  {
    name: 'Main.java',
    path: 'java-app/src/main/java/com/taskflow/Main.java',
    language: 'java',
    category: 'Java Desktop App',
    content: `package com.taskflow;

import com.taskflow.integration.CppEngineClient;
import com.taskflow.service.TaskService;
import com.taskflow.storage.CsvTaskRepository;
import com.taskflow.storage.TaskRepository;
import com.taskflow.ui.MainWindow;
import javax.swing.SwingUtilities;

public class Main {
    public static void main(String[] args) {
        TaskRepository repository = new CsvTaskRepository("data/tasks.csv");
        CppEngineClient engineClient = new CppEngineClient();
        TaskService taskService = new TaskService(repository, engineClient);

        SwingUtilities.invokeLater(() -> {
            MainWindow window = new MainWindow(taskService);
            window.setVisible(true);
        });
    }
}`
  },
  {
    name: 'CppEngineClient.java',
    path: 'java-app/src/main/java/com/taskflow/integration/CppEngineClient.java',
    language: 'java',
    category: 'Java Desktop App',
    content: `package com.taskflow.integration;

import java.io.*;
import java.nio.charset.StandardCharsets;

public class CppEngineClient {
    private String executablePath;
    private boolean engineAvailable = false;

    public synchronized String executeCommand(String jsonCommand) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(executablePath);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        // Write to stdin
        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream(), StandardCharsets.UTF_8))) {
            writer.write(jsonCommand);
            writer.newLine();
            writer.flush();
        }

        // Read stdout
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            return reader.readLine();
        }
    }
}`
  },
  {
    name: 'CsvTaskRepository.java',
    path: 'java-app/src/main/java/com/taskflow/storage/CsvTaskRepository.java',
    language: 'java',
    category: 'Java Desktop App',
    content: `// RFC 4180 Compliant CSV Storage Engine
// Implements character-by-character quote escaping and atomic file moves (Files.move with REPLACE_EXISTING).`
  },
  {
    name: 'setup-and-run.bat',
    path: 'scripts/setup-and-run.bat',
    language: 'bat',
    category: 'Scripts & Build',
    content: `@echo off
echo ========================================================
echo   TaskFlow — One-Click Setup and Launch
echo ========================================================
call scripts\\build.bat
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build step failed.
    pause
    exit /b %ERRORLEVEL%
)
call scripts\\run.bat`
  },
  {
    name: 'build.bat',
    path: 'scripts/build.bat',
    language: 'bat',
    category: 'Scripts & Build',
    content: `@echo off
echo Compiling C++ Task Engine...
g++ -std=c++17 -O2 -I cpp-engine/include cpp-engine/src/task_engine.cpp cpp-engine/src/main.cpp -o cpp-engine/build/bin/task_engine.exe
echo Compiling Java Application...
javac -encoding UTF-8 -d java-app/bin java-app/src/main/java/com/taskflow/**/*.java`
  },
  {
    name: 'PROJECT_REPORT.md',
    path: 'docs/PROJECT_REPORT.md',
    language: 'markdown',
    category: 'Academic Documentation',
    content: `# TASKFLOW — PROJECT REPORT
Academic Session: 2026–2027
Department of Computer Science & Engineering
Topics: Abstract, Problem Statement, Objectives, C++17 Engine, Java 17 Swing, ProcessBuilder IPC, RFC 4180 CSV, Automated Testing Results, Conclusion & Future Scope.`
  },
  {
    name: 'VIVA_QUESTIONS.md',
    path: 'docs/VIVA_QUESTIONS.md',
    language: 'markdown',
    category: 'Academic Documentation',
    content: `# TASKFLOW — VIVA VOCE QUESTIONS & ANSWERS
Contains 22 detailed questions and answers covering:
- Inter-Process Communication (IPC via ProcessBuilder)
- C++ Data Structures & std::sort (Introsort)
- Memory Safety & RAII
- Java OOP Principles (Encapsulation, Observer Pattern, SRP)
- RFC 4180 CSV Escaping & Atomic Writes
- Failover Architecture`
  },
  {
    name: 'PRESENTATION_SCRIPT.md',
    path: 'docs/PRESENTATION_SCRIPT.md',
    language: 'markdown',
    category: 'Academic Documentation',
    content: `# 3-5 MINUTE PRESENTATION SCRIPT
Structured into:
- 0:00 - 0:45: Project Introduction & Rationale
- 0:45 - 2:00: Live GUI Demonstration (Add, Edit, Filter, Velocity Bar)
- 2:00 - 3:00: C++ & IPC Deep Dive (ProcessBuilder & JSON Ping)
- 3:00 - 3:45: RFC 4180 CSV Persistence Walkthrough
- 3:45 - 4:15: Conclusion & Professor Q&A`
  },
  {
    name: 'tasks.csv',
    path: 'data/tasks.csv',
    language: 'csv',
    category: 'Data',
    content: `id,title,description,category,priority,dueDate,completed,createdAt
task-1,Complete Data Structures assignment,"Implement Red-Black tree deletion and benchmark search latency.",COLLEGE,HIGH,2026-10-15,false,2026-10-14T09:00:00
task-2,Prepare Java practical demonstration,"Walk through ProcessBuilder IPC architecture and RFC 4180 CSV parser.",COLLEGE,MEDIUM,2026-10-14,false,2026-10-14T09:15:00
task-3,Submit Final Project Report,"Compile IEEE format project report, system architecture diagrams, and test results.",PROJECTS,HIGH,2026-10-17,false,2026-10-14T09:30:00
task-4,Review OS synchronization lecture,"Revise semaphores, mutex locks, and inter-process message passing.",COLLEGE,MEDIUM,2026-10-18,false,2026-10-14T09:45:00
task-5,Organize personal study notes,"Sort semester revision flashcards into binders.",PERSONAL,LOW,2026-10-21,false,2026-10-14T10:00:00
task-6,Submit Lab Assistant Timesheet,"Log university research lab assistant hours for the academic week.",WORK,MEDIUM,2026-10-12,false,2026-10-14T08:00:00
task-7,Set up Git repository for presentation,"Initialize clean commit history and tag presentation-ready release v1.0.",PROJECTS,MEDIUM,2026-10-13,true,2026-10-13T16:00:00`
  }
];
