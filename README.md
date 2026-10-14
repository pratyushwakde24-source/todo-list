# TaskFlow — Smart To-Do Manager (C++ + Java)

[![Language: C++17](https://img.shields.io/badge/Language-C%2B%2B17-blue.svg)](https://isocpp.org/)
[![Language: Java 17](https://img.shields.io/badge/Language-Java%2017-orange.svg)](https://openjdk.org/)
[![GUI: Java Swing](https://img.shields.io/badge/GUI-Java%20Swing-green.svg)]()
[![IPC: ProcessBuilder](https://img.shields.io/badge/IPC-ProcessBuilder%20JSON-purple.svg)]()
[![Tests: 100% Passed](https://img.shields.io/badge/Tests-100%25%20Passed-brightgreen.svg)]()

> **Presentation-Ready College Capstone Project**  
> A desktop task management architecture pairing a high-speed **C++17 algorithmic co-processor** with an Object-Oriented **Java 17 Swing graphical interface** via **ProcessBuilder standard-stream IPC** and **RFC 4180 CSV persistence**.

---

## 1. PROJECT OVERVIEW

**TaskFlow** demonstrates genuine multi-language systems programming for academic evaluation. Rather than relying on a monolithic architecture, TaskFlow strategically splits responsibilities:
- **C++17 Core Engine**: Handles priority queue calculations, deadline overdue tracking, category filtration, and statistical aggregations.
- **Java 17 Desktop Client**: Implements modern Object-Oriented Design (OOD), an interactive Swing user interface, input validation, and atomic RFC 4180 CSV data persistence.
- **Inter-Process Communication (IPC)**: The JVM invokes the native C++ binary using `java.lang.ProcessBuilder`, piping structured JSON commands over standard input/output streams (`stdin`/`stdout`).

The system operates **100% locally and offline** on Windows and Linux without cloud accounts, paid APIs, or external dependencies.

---

## 2. KEY FEATURES

- [x] **Real-Time Productivity Dashboard**: Total, completed, pending, and overdue KPI cards with dynamic completion velocity progress bar.
- [x] **Genuine C++ & Java IPC**: Real standard-stream JSON communication via `ProcessBuilder` with millisecond diagnostic ping.
- [x] **Full Task Lifecycle (CRUD)**: Create, edit, delete (with confirmation), and toggle task completion.
- [x] **Priority & Due Date Engine**: High, Medium, and Low priority weighting with automated deadline overdue detection.
- [x] **Multi-Criteria Filtering & Sorting**: Filter by Category (College, Personal, Work, Projects, Other), Priority, and Status; sort by Priority rank, Due Date, or Creation time.
- [x] **RFC 4180 CSV Storage**: Custom quote-escaped parser supporting commas, quotation marks, and multiline descriptions in `data/tasks.csv`.
- [x] **Atomic File Writes**: Prevents database corruption by staging saves in a temporary file before atomic filesystem swaps.
- [x] **Presentation Demo Mode**: Pre-loaded with realistic college demonstration tasks and one-click data restore.
- [x] **Graceful Fallback**: If the C++ binary is not compiled yet, transparent Java fallback routines prevent crashes.
- [x] **Comprehensive Viva & Presentation Hub**: In-app architecture diagrams, viva Q&A viewer, and automated test runners.

---

## 3. SYSTEM ARCHITECTURE & DATA FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                 Java 17 Swing Desktop Client                │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │  Dashboard   │   │  Task List   │   │  Add / Edit     │  │
│  │     View     │   │     View     │   │     Dialog      │  │
│  └──────┬───────┘   └──────┬───────┘   └────────┬────────┘  │
│         └──────────────────┼────────────────────┘           │
│                            ▼                                │
│                   TaskService (Logic)                       │
│              ┌─────────────┴─────────────┐                  │
│              ▼                           ▼                  │
│     CsvTaskRepository             CppEngineClient           │
│        (RFC 4180)                 (ProcessBuilder)          │
│              │                           │                  │
└──────────────┼───────────────────────────┼──────────────────┘
               │                           │ (stdin / stdout)
               ▼                           ▼ JSON Stream
       ┌───────────────┐           ┌───────────────────────┐
       │data/tasks.csv │           │  C++17 Task Engine    │
       └───────────────┘           │  - Priority Ranking   │
                                   │  - Overdue Math       │
                                   │  - Sort & Filter      │
                                   │  - Aggregate Stats    │
                                   └───────────────────────┘
```

---

## 4. SYSTEM REQUIREMENTS

- **Operating System**: Windows 10/11 (or Linux / macOS)
- **Java**: Java Development Kit (JDK) 17 or higher (`javac` and `java` on PATH)
- **C++ Compiler**: `g++` (MinGW-w64 on Windows) or `clang++` supporting C++17
- **RAM**: Minimum 512 MB
- **Disk Space**: ~25 MB (including compiled binaries)
- **Internet**: No internet connection required.

---

## 5. QUICK START & RUN INSTRUCTIONS

### Windows (One-Click Setup)
1. Open PowerShell or Command Prompt in the project folder.
2. Run the one-click build and launch script:
   ```cmd
   scripts\setup-and-run.bat
   ```
3. For subsequent launches without recompiling:
   ```cmd
   scripts\run.bat
   ```

### Manual Build Instructions (Windows)
```cmd
:: 1. Compile C++ Engine
g++ -std=c++17 -O2 -I cpp-engine/include cpp-engine/src/task_engine.cpp cpp-engine/src/main.cpp -o cpp-engine/build/bin/task_engine.exe

:: 2. Compile Java Application
javac -encoding UTF-8 -d java-app/bin java-app/src/main/java/com/taskflow/*.java java-app/src/main/java/com/taskflow/**/*.java

:: 3. Launch Application
java -cp java-app/bin com.taskflow.Main
```

### Linux / macOS
```bash
# Build and run all automated tests
make all

# Launch desktop GUI (or CLI verification if headless)
make run
```

---

## 6. PROJECT DIRECTORY STRUCTURE

```
TaskFlow/
├── README.md                           # Master project guide
├── Makefile                            # Standard Unix makefile (build & test)
├── cpp-engine/                         # C++17 Core Processing Engine
│   ├── CMakeLists.txt                  # CMake build definition
│   ├── include/
│   │   └── task_engine.h               # Engine headers & structs
│   ├── src/
│   │   ├── main.cpp                    # Stdin/stdout IPC runner & CLI flags
│   │   └── task_engine.cpp             # Ranking, sorting, and stats algorithms
│   └── tests/
│       └── test_engine.cpp             # Automated unit tests for C++
├── java-app/                           # Java 17 Swing Desktop Client
│   └── src/
│       ├── main/java/com/taskflow/
│       │   ├── Main.java               # Application entry point
│       │   ├── model/                  # Domain entities (Task, Priority, Category, Stats)
│       │   ├── storage/                # RFC 4180 CsvTaskRepository
│       │   ├── integration/            # CppEngineClient (ProcessBuilder IPC)
│       │   ├── service/                # TaskService business logic & validation
│       │   └── ui/                     # Swing GUI (MainWindow, Dashboard, Tasks, Dialogs)
│       └── test/java/com/taskflow/
│           └── TaskServiceTest.java    # Automated Java unit test suite
├── scripts/                            # Windows & Unix startup scripts
│   ├── build.bat                       # Windows C++ and Java compiler
│   ├── run.bat                         # Windows application launcher
│   ├── setup-and-run.bat               # One-click Windows setup and launch
│   ├── build.sh                        # Linux/macOS build script
│   └── run.sh                          # Linux/macOS run script
├── docs/                               # Academic College Documentation Suite
│   ├── PROJECT_REPORT.md               # Complete academic report (IEEE style)
│   ├── ARCHITECTURE.md                 # System architecture & Mermaid diagrams
│   ├── VIVA_QUESTIONS.md               # 20+ likely viva questions and answers
│   └── PRESENTATION_SCRIPT.md          # 3-5 minute live demonstration script
└── data/
    └── tasks.csv                       # Local RFC 4180 task storage
```

---

## 7. AUTOMATED TEST SUITE & VERIFICATION

TaskFlow includes comprehensive automated unit test suites for both languages:

### Running Tests
```bash
make test
```
**Test Results:**
- C++ Tests:
  - `Priority Ranking`: **PASSED** (High=3, Medium=2, Low=1)
  - `Overdue & Due Today Detection`: **PASSED** (Boundary date logic)
  - `Validation Logic`: **PASSED** (Blank title rejection, ISO dates)
  - `Aggregate Statistics`: **PASSED** (Velocity, overdue, pending)
  - `JSON IPC Command Parser`: **PASSED** (Structured stdin commands)
- Java Tests:
  - `Task Creation & Input Validation`: **PASSED**
  - `RFC 4180 Comma & Quote Escaping`: **PASSED**
  - `Task Update & Completion Toggle`: **PASSED**
  - `Category & Priority Sorting`: **PASSED**
  - `Task Deletion`: **PASSED**
  - `Dashboard Statistics Computation`: **PASSED**

---

## 8. DEMONSTRATION WORKFLOW FOR PROFESSORS

1. **Launch App**: Open `TaskFlow` and review the **Dashboard** metrics.
2. **Add a Live Task**: Click **"+ Add Task"**, input title and deadline, and show immediate KPI recalculation.
3. **Toggle Completion**: Check off a task to show instant velocity progress bar update.
4. **Demonstrate IPC**: Switch to **"Viva & Architecture"** and click **"Run Live C++ Ping (JSON IPC)"** to demonstrate sub-5ms ProcessBuilder execution.
5. **Inspect Persistence**: Open `data/tasks.csv` in Notepad to prove RFC 4180 compliant storage.
