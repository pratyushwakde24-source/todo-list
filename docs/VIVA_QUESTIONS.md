# TASKFLOW — COLLEGE VIVA VOCE QUESTIONS & ANSWERS GUIDE

This guide prepares you for questions commonly asked by professors and external examiners during final project viva examinations.

---

## CATEGORY 1: ARCHITECTURE & INTER-PROCESS COMMUNICATION (IPC)

### Q1: Why did you choose both C++ and Java instead of building the entire project in one language?
**Answer:**  
C++ provides high-performance, deterministic execution speed and low memory overhead without garbage collection pauses, making it ideal for core algorithmic processing (sorting, filtering, deadline analysis). Java provides robust Object-Oriented design and an out-of-the-box cross-platform Graphical User Interface (Swing). Combining them demonstrates practical multi-language systems integration.

### Q2: How do Java and C++ communicate in TaskFlow?
**Answer:**  
They communicate via **Inter-Process Communication (IPC)** using standard input (`stdin`) and standard output (`stdout`) streams. Java launches the C++ binary using `java.lang.ProcessBuilder`, streams a structured JSON command payload into the process's standard input, and reads the computed JSON result from standard output.

### Q3: What is `ProcessBuilder` in Java, and how does it differ from `Runtime.getRuntime().exec()`?
**Answer:**  
`ProcessBuilder` is a modern Java API (introduced in Java 5) for managing operating system processes. Unlike `Runtime.exec()`, `ProcessBuilder` allows fine-grained control over process working directories, environment variables, standard I/O redirection, and merged error streams (`redirectErrorStream(true)`).

### Q4: Why did you use JSON over standard I/O instead of Java Native Interface (JNI)?
**Answer:**  
JNI requires compiling platform-specific native shared libraries (`.dll` or `.so`), manages complex C-style memory pointers, and can crash the entire JVM if memory leaks occur. Standard I/O with JSON provides complete process isolation: if the C++ engine encounters an error, the Java desktop GUI remains stable and operational. Additionally, JSON payloads can be inspected and verified independently in the console.

### Q5: What happens if the C++ executable is deleted or not yet compiled?
**Answer:**  
The application uses a **graceful degradation (failover)** pattern in `CppEngineClient`. If the binary cannot be located, the system logs an informative warning and automatically switches to built-in Java algorithmic fallback routines, preventing application crashes.

---

## CATEGORY 2: C++ DATA STRUCTURES & ALGORITHMS

### Q6: Which data structures are used in the C++ engine?
**Answer:**  
- `std::vector<Task>`: Dynamic array providing contiguous memory allocation, $O(1)$ amortized insertion, and cache-friendly iteration for sorting and filtering.
- `std::string`: Safe, dynamic string manipulation for titles, descriptions, and ISO date formatting.
- `std::ostringstream`: Efficient in-memory string formatting for JSON serialization.

### Q7: How does C++ sort tasks, and what is its time complexity?
**Answer:**  
We use `std::sort` from `<algorithm>`, which is implemented as **Introsort** (a hybrid of Quicksort, Heapsort, and Insertion Sort). Its worst-case and average-case time complexity is $O(N \log N)$, where $N$ is the number of tasks.

### Q8: How does TaskFlow rank task priorities in C++?
**Answer:**  
The `TaskEngine::priorityRank()` function maps text priorities to numeric weights:
`High` $\rightarrow 3$, `Medium` $\rightarrow 2$, `Low` $\rightarrow 1$. During multi-criteria sorting, tasks are compared by this numeric rank in descending order, with secondary comparisons resolving ties using deadline dates.

### Q9: How does the C++ engine detect overdue tasks?
**Answer:**  
Dates are stored in ISO 8601 format (`YYYY-MM-DD`). Because numbers in ISO format are structured from largest unit (year) to smallest unit (day), lexicographical string comparison (`task.dueDate < todayDate`) accurately determines if a deadline has passed without needing external date parsing libraries.

### Q10: How does C++ handle memory management in this project?
**Answer:**  
It follows modern C++ **RAII (Resource Acquisition Is Initialization)** principles. We use standard library containers (`std::vector`, `std::string`) rather than raw pointers (`new`/`delete`), eliminating memory leaks and dangling pointers.

---

## CATEGORY 3: JAVA OBJECT-ORIENTED PROGRAMMING & DESIGN

### Q11: What Object-Oriented Programming (OOP) principles did you apply in Java?
**Answer:**  
1. **Encapsulation**: Private instance variables in `Task`, `DashboardStats`, etc., accessed via public getters and setters.
2. **Abstraction**: The `TaskRepository` interface abstracts file storage details away from `TaskService`.
3. **Polymorphism**: The `TaskChangeListener` interface enables different UI panels to receive reactive update notifications.
4. **Single Responsibility Principle (SRP)**: UI, storage, business logic, and IPC are strictly segregated into dedicated classes.

### Q12: Explain the Observer Pattern implemented in the UI.
**Answer:**  
`TaskService` maintains a list of `TaskChangeListener` subscribers. When a task is created, edited, deleted, or toggled, `TaskService.notifyListeners()` informs registered panels (`DashboardPanel`, `TasksPanel`), triggering an immediate UI repaint without tight coupling.

### Q13: What layout managers are used in the Swing GUI, and why?
**Answer:**  
We avoid fragile absolute positioning (`null` layouts). Instead, we use:
- `BorderLayout` for top headers, main content, and footers.
- `BoxLayout` (Y-axis) for vertical card stacks.
- `GridLayout` for evenly spaced KPI dashboard metric cards.
- `FlowLayout` for action button toolbars.  
This guarantees responsive window resizing across varying screen resolutions.

---

## CATEGORY 4: DATA PERSISTENCE & FILE HANDLING

### Q14: What file format is used for persistent storage, and why?
**Answer:**  
We use **RFC 4180 compliant CSV (Comma-Separated Values)** stored in `data/tasks.csv`. It is lightweight, requires no external database engine or drivers, and can be inspected in standard tools like Excel or Notepad.

### Q15: Why is standard string splitting (`line.split(",")`) dangerous for CSV files?
**Answer:**  
Basic string splitting fails if a user types a comma or quotation mark inside a task title or description (e.g. `"Revise trees, graphs, and heaps"`). It incorrectly splits the sentence into separate columns, corrupting the database.

### Q16: How does TaskFlow ensure RFC 4180 CSV compliance?
**Answer:**  
Our `CsvTaskRepository` implements a character-by-character state-machine parser:
1. Cells containing commas, quotes, or newlines are wrapped in double quotes.
2. Internal quotation marks are escaped by doubling them (`""`).
3. Multiline descriptions are preserved across line breaks.

### Q17: What are atomic file writes, and why are they used?
**Answer:**  
If a program crashes or loses power while writing directly to `tasks.csv`, the file can be truncated or corrupted. TaskFlow writes to a temporary file (`tasks.csv.tmp`) first, and upon successful write, performs an atomic filesystem replace (`Files.move`), ensuring complete data integrity.

---

## CATEGORY 5: VALIDATION, ERROR HANDLING & TESTING

### Q18: What input validation checks are enforced?
**Answer:**  
- Task titles are required and cannot be blank or exceed 150 characters.
- Due dates must adhere to the valid `YYYY-MM-DD` calendar format.
- Priority and Category values are constrained to strict enums (`High`, `Medium`, `Low`, etc.).

### Q19: How are errors communicated to the user?
**Answer:**  
Input validation failures throw a dedicated `ValidationException` displayed directly to the user in modal dialogues without terminating the JVM. System errors are caught and logged with actionable advice rather than allowing silent crashes.

### Q20: What automated tests were implemented, and what did they verify?
**Answer:**  
- **C++ Tests (`test_engine.cpp`)**: Verified priority ranking weights, boundary date overdue logic, statistics formulas, and JSON command parsing.
- **Java Tests (`TaskServiceTest.java`)**: Verified task creation, input constraints, RFC 4180 quotes/commas escaping, CRUD operations, and completion toggles.

---

## CATEGORY 6: PRESENTATION & DEMONSTRATION TIPS

### Q21: What command launches the application on Windows?
**Answer:**  
Executing `scripts\setup-and-run.bat` automatically builds the C++ engine, compiles the Java application, and launches the desktop GUI. Subsequent runs can be launched directly using `scripts\run.bat`.

### Q22: How can I prove to the examiner that the C++ engine is actually running?
**Answer:**  
Navigate to the **Viva & Architecture** tab in the desktop application and click **Run Live C++ Ping (JSON IPC)**. The panel executes the compiled C++ binary via `ProcessBuilder`, captures the live JSON response with elapsed millisecond latency, and displays the engine diagnostic status.
