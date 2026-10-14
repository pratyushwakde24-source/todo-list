# PROJECT REPORT: TASKFLOW — SMART TO-DO MANAGEMENT SYSTEM

**Academic Session**: 2026–2027  
**Department**: Computer Science and Engineering  
**Project Title**: TaskFlow — High-Performance Dual-Language Task Management Architecture  
**Core Technologies**: C++17, Java 17 (Swing), Inter-Process Communication (IPC via `ProcessBuilder`), RFC 4180 CSV Storage  

---

## 1. ABSTRACT

Modern computing architectures frequently synthesize multi-paradigm software stacks to balance low-level algorithmic efficiency with high-level graphical interaction and rapid application development. **TaskFlow** is an enterprise-grade desktop task management system designed to demonstrate genuine inter-language computing between **C++17** and **Java 17**. 

The system leverages C++ for its deterministic algorithmic runtime, executing priority queue calculations, deadline overdue tracking, category filtration, and statistical aggregations. The user-facing presentation layer is engineered in Java Swing, utilizing Object-Oriented Design (OOD) patterns, event-driven reactive updates, and an RFC 4180 compliant CSV persistence engine. Communication between the Java virtual machine (JVM) and the compiled C++ executable is orchestrated over standard input and standard output streams (`stdin`/`stdout`) using structured JSON command packets managed by Java's `ProcessBuilder`. The application operates entirely offline without external dependencies or cloud subscriptions.

---

## 2. INTRODUCTION & PROBLEM STATEMENT

### 2.1 Background
Task management systems serve as critical personal productivity tools for students, academic researchers, and enterprise teams. However, standard educational software projects often rely solely on monolithic single-language implementations, neglecting real-world systems engineering techniques where separate language runtimes collaborate.

### 2.2 Problem Statement
Developing a reliable, presentation-ready desktop task manager requires:
1. Deterministic sorting and date parsing routines capable of handling varied task loads without garbage collection pauses.
2. A responsive, modern graphical user interface (GUI) with dark mode styling, intuitive workflows, and instant metric recalculation.
3. Clean inter-process communication that is human-readable, testable, and fault-tolerant.
4. Permanent local persistence that respects RFC 4180 standard escaping to prevent file corruption from commas, quotes, and multi-line task descriptions.
5. Absolute zero dependence on external commercial APIs, proprietary libraries, or internet connectivity.

---

## 3. OBJECTIVES

The core objectives of the TaskFlow project are:
- **Modular Division of Labor**: Implement core algorithmic operations (priority ranking, sorting, filtering, deadline analysis) in a standalone C++17 engine, while managing UI, input validation, and data persistence in Java.
- **Genuine IPC Implementation**: Bridge the C++ binary and Java runtime via standard I/O pipes using `ProcessBuilder`, avoiding mocked interfaces or fake integrations.
- **RFC 4180 Compliance**: Develop a custom CSV parser and serializer in Java that safely handles embedded commas, double quotation escaping (`""`), and multiline descriptions.
- **Modern UI/UX**: Deliver a dark charcoal desktop interface with warm gold accents, fluid card layouts, instant search/filtering, and immediate dashboard KPI synchronization.
- **Academic Rigor & Testability**: Provide automated test suites for both C++ and Java modules, complete with a comprehensive viva preparation guide and live demonstration workflow.

---

## 4. SYSTEM DESIGN & ARCHITECTURE

TaskFlow adopts a decoupled multi-tier architecture consisting of:
1. **Presentation Layer (Java Swing)**: `MainWindow`, `DashboardPanel`, `TasksPanel`, `TaskDialog`, and `AboutPanel`.
2. **Service Layer (Java)**: `TaskService` coordinating domain events and input validation.
3. **Integration Layer (Java IPC)**: `CppEngineClient` managing process lifecycle and JSON serialization.
4. **Algorithmic Engine (C++17)**: `TaskEngine` executing ranking, sorting algorithms, and statistical aggregations.
5. **Persistence Layer (Java)**: `CsvTaskRepository` maintaining `data/tasks.csv` with atomic writes.

```
+-------------------------------------------------------------------+
|                     Java 17 Swing Desktop GUI                    |
|   [Dashboard]       [Task Management Table]       [Viva Hub]     |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                    TaskService (Business Logic)                   |
+------------------+------------------------------+-----------------+
                   |                              |
                   v                              v
    +------------------------------+  +---------------------------+
    | CppEngineClient (IPC Bridge) |  | CsvTaskRepository (Store) |
    +--------------+---------------+  +-------------+-------------+
                   |                                |
       (stdin/stdout JSON Pipes)                    | (RFC 4180)
                   v                                v
    +------------------------------+  +---------------------------+
    | C++17 Standalone Task Engine |  |      data/tasks.csv       |
    |  - Priority Ranker           |  +---------------------------+
    |  - Date Overdue Math         |
    |  - Multi-Criteria Sorting    |
    |  - Aggregate Statistics      |
    +------------------------------+
```

---

## 5. IMPLEMENTATION DETAILS

### 5.1 C++17 Algorithmic Engine
- **Memory Safety & Modern Idioms**: Uses `std::vector`, `std::string`, `std::ostringstream`, and lambda predicates.
- **Priority Ranking**:
  - `High` $\rightarrow$ Rank 3
  - `Medium` $\rightarrow$ Rank 2
  - `Low` $\rightarrow$ Rank 1
- **Sorting Algorithms**: `std::sort` parametrized by enum criteria (`DUE_DATE_ASC`, `PRIORITY_DESC`, `TITLE_ASC`, `CREATED_AT_DESC`).
- **Date Arithmetic**: Lexicographical comparison for ISO 8601 strings (`YYYY-MM-DD`), accurately detecting overdue tasks relative to today's date without temporal library bloat.
- **JSON Parser**: Lightweight state-machine parser capable of processing JSON command packets from `stdin`.

### 5.2 Java 17 Swing Interface & Services
- **Encapsulation & OOP**: Strict encapsulation of fields inside `Task`, `Priority`, `Category`, and `DashboardStats`.
- **Event-Driven Observer Pattern**: `TaskChangeListener` interface triggers instant UI updates across the Dashboard and Task Table when any CRUD action occurs.
- **Input Validation**: Custom `ValidationException` enforcing non-empty titles (1–150 characters) and ISO date format compliance.

### 5.3 Inter-Process Communication (IPC)
- Java instantiates `ProcessBuilder` targeting `task_engine` (or `task_engine.exe` on Windows).
- Command object:
  ```json
  {"action": "STATISTICS", "today": "2026-10-14", "tasks": [...]}
  ```
- C++ reads from standard input, calculates metrics, and emits JSON response to standard output:
  ```json
  {"status":"OK","stats":{"totalTasks":6,"completedTasks":1,"pendingTasks":5,"overdueTasks":1,"completionPercentage":16.7}}
  ```
- **Resilience**: In the event that the C++ binary is missing, `CppEngineClient` gracefully falls back to Java calculations, logging a clear diagnostic rather than crashing.

### 5.4 Data Persistence
- Custom RFC 4180 compliant CSV parser and serializer.
- Atomic file operations: Writes to `tasks.csv.tmp` and performs atomic move (`Files.move` with `REPLACE_EXISTING`), guaranteeing protection against file corruption.

---

## 6. RESULTS & TESTING

The system underwent rigorous automated and manual testing:

| Test Category | Target Component | Description | Result |
| :--- | :--- | :--- | :--- |
| **C++ Unit Tests** | `testPriorityRanking` | Validates High/Med/Low rank mapping | **PASSED** |
| **C++ Unit Tests** | `testOverdueDetection` | Validates boundary dates and completed exclusion | **PASSED** |
| **C++ Unit Tests** | `testStatistics` | Validates total, pending, and percentage logic | **PASSED** |
| **C++ Unit Tests** | `testJsonIpc` | Validates JSON command input and serialization | **PASSED** |
| **Java Unit Tests** | `testTaskCreationAndValidation`| Tests valid creations and rejection of blank titles | **PASSED** |
| **Java Unit Tests** | `testRfc4180SpecialCharacters` | Tests quotes, commas, and multiline descriptions | **PASSED** |
| **Java Unit Tests** | `testUpdateAndToggleCompletion`| Tests status updates and field mutation | **PASSED** |
| **Java Unit Tests** | `testDeletion` | Tests deletion and list consistency | **PASSED** |
| **End-to-End** | GUI Resizing & Persistence | Verifies window resizing and state reload on restart | **PASSED** |

---

## 7. CONCLUSION & FUTURE SCOPE

### 7.1 Conclusion
TaskFlow successfully illustrates how modern systems programming languages (C++) can be elegantly combined with high-level enterprise application runtimes (Java). The resulting application achieves fast algorithmic response times, robust local persistence, an intuitive dark-themed UI, and genuine inter-process communication.

### 7.2 Future Scope
1. **Shared Memory IPC**: Upgrade standard I/O pipes to POSIX/Win32 shared memory (`boost::interprocess` or Windows `CreateFileMapping`) for microsecond throughput on million-task datasets.
2. **Subtask Trees & Dependencies**: Extend task models to support directed acyclic graph (DAG) dependency trees.
3. **Calendar Grid View**: Add an interactive monthly calendar widget visualizing upcoming academic assignment deadlines.
