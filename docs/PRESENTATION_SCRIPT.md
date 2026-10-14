# TASKFLOW — 3-5 MINUTE COLLEGE PRESENTATION & DEMO SCRIPT

Use this step-by-step script during your project presentation. It is organized into timed sections with exact talking points and live demonstration clicks.

---

## 1. PRESENTATION TIMELINE OVERVIEW (TOTAL: 4 MINUTES)

| Timestamp | Phase | Topic / Demonstration Action |
| :--- | :--- | :--- |
| **0:00 - 0:45** | **Introduction** | Project name, objective, problem statement, and dual-language rationale. |
| **0:45 - 2:00** | **Live Demo (GUI)** | Dashboard metrics, adding a task live, changing priority, completion toggle, filter & sort. |
| **2:00 - 3:00** | **C++ & IPC Deep Dive** | ProcessBuilder explanation, live JSON ping in Viva Hub, architecture breakdown. |
| **3:00 - 3:45** | **Persistence & Stability**| RFC 4180 CSV inspection, atomic write safety, proof of persistence. |
| **3:45 - 4:15** | **Conclusion & Q&A** | Summary of results, automated test pass rate, inviting professor questions. |

---

## 2. STEP-BY-STEP SPOKEN SCRIPT & DEMO ACTIONS

### 0:00 - 0:45 | INTRODUCING THE PROJECT

> *"Respected professors and evaluators, good morning. Today I am presenting **TaskFlow — Smart To-Do Manager**, a presentation-ready desktop task management architecture built using both **C++17** and **Java 17**.*
>
> *In enterprise engineering, monolithic architectures often suffer from performance trade-offs. TaskFlow solves this by dividing system responsibilities: we use a compiled, native C++17 engine for core algorithmic heavy-lifting—such as priority queue ranking, deadline calculations, and multi-criteria sorting—while employing an Object-Oriented Java 17 Swing application for the graphical interface and persistent data storage.*
>
> *The two runtimes communicate seamlessly via Inter-Process Communication using standard I/O pipes. The entire system is self-contained, runs locally on Windows, and requires no external APIs or internet connection."*

---

### 0:45 - 2:00 | LIVE GUI DEMONSTRATION

#### Step 1: Open the Application & Show Dashboard
- **Action**: Launch the application (or show the active Dashboard view).
- **Spoken**:  
  > *"Here is the TaskFlow desktop dashboard. At a glance, the top KPI cards show our total tasks, completed tasks, pending tasks, and overdue tasks. Notice the completion velocity progress bar currently sitting at 14.3%. All of these metrics are dynamically calculated in real time by our C++ co-processor."*

#### Step 2: Add a Task Live
- **Action**: Click the **"+ Add New Task"** button.
- **Action**: In the dialog, enter:
  - Title: `Prepare Presentation Slides for External Examiner`
  - Category: `College`
  - Priority: `High`
  - Due Date: *Tomorrow's date (e.g., 2026-10-15)*
- **Action**: Click **"Create Task"**.
- **Spoken**:  
  > *"Now I will add a high-priority academic task live. When I click 'Create Task', the input is validated against our constraints, saved atomically to our local RFC 4180 CSV storage, and the C++ engine immediately recalculates the dashboard stats. Notice how Pending Tasks incremented and our High-Priority task list updated instantly."*

#### Step 3: Complete a Task & Filter
- **Action**: Check the completion box for `Prepare Presentation Slides for External Examiner`.
- **Spoken**:  
  > *"When I check off this task, the completion status flips, and the C++ engine recalculates our completion percentage immediately from 14.3% to 25.0%."*
- **Action**: Click **"All Tasks"** in the sidebar. Show search and category filters.
- **Spoken**:  
  > *"Under 'All Tasks', users can filter by Category like College or Projects, filter by Priority, or sort by due date. Notice how responsive the card list is."*

---

### 2:00 - 3:00 | DEMONSTRATING THE C++ ENGINE & IPC (THE "WOW" FACTOR)

- **Action**: Click **"Viva & Architecture"** in the sidebar.
- **Spoken**:  
  > *"Now let me demonstrate the core technical requirement: how Java and C++ communicate. Under the Viva Hub, we can see the live status of the C++ engine.*
  >
  > *Java uses `java.lang.ProcessBuilder` to spawn the native binary `task_engine.exe`. When Java needs statistics or sorting, it serializes the task list into a standard JSON payload and streams it into the C++ engine's `stdin`. The C++ engine processes the command and returns the JSON result via `stdout`.*
  >
  > *Let's run a live diagnostic ping to prove this integration."*
- **Action**: Click the **"Run Live C++ Ping (JSON IPC)"** button.
- **Spoken**:  
  > *"As you can see on screen, the C++ process responded in under 5 milliseconds with status OK, confirming active process execution across the language boundary."*

---

### 3:00 - 3:45 | PROVING DATA PERSISTENCE & ATOMIC WRITES

- **Action**: Explain the data storage layer.
- **Spoken**:  
  > *"For data persistence, all tasks are stored locally in `data/tasks.csv`. We adhered to the strict RFC 4180 CSV specification with custom quote and comma escaping. This guarantees that if a user includes commas, quotation marks, or multiple lines in their notes, the file is never corrupted.*
  >
  > *Furthermore, we use atomic file replacement: the repository writes to a temporary file first and swaps it atomically via `Files.move`, preventing corrupted files even if power is lost mid-write."*

---

### 3:45 - 4:15 | CONCLUSION & PROFESSOR Q&A

- **Spoken**:  
  > *"To verify code quality, we created automated unit test suites in both C++ and Java covering priority ranking, date math, CSV escaping, and CRUD operations. All tests passed with 100% success.*
  >
  > *TaskFlow is fully functional, requires no cloud dependencies, and is ready for production use. Thank you, and I am now ready for your questions."*

---

## 3. RAPID-FIRE PROFESSOR QUESTIONS & READY RESPONSES

| Likely Professor Question | Immediate Confident Response |
| :--- | :--- |
| **"Where is the C++ code actually invoked in Java?"** | *"Inside `com.taskflow.integration.CppEngineClient.java` in the `executeCommand()` method using `ProcessBuilder.start()`."* |
| **"Why not use JNI instead?"** | *"JNI creates tightly coupled native memory bindings where a C++ crash crashes the JVM. Standard I/O with JSON provides true process isolation and testability."* |
| **"How do you handle a missing C++ binary?"** | *"The `CppEngineClient` detects binary absence and seamlessly falls back to Java calculations, logging a clear warning without crashing."* |
| **"How does C++ know if a task is overdue?"** | *"Using ISO 8601 `YYYY-MM-DD` strings, C++ performs lexicographical comparison against today's date (`dueDate < todayDate`), which is $O(1)$ and eliminates time zone library overhead."* |
