# TaskFlow — C++ + Java Smart To-Do Management System

A presentation-ready, high-performance task management system pairing a C++17 core processing engine with a Java 17 Swing desktop application and an interactive web companion for live demonstration and college viva evaluation.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural directions confirmed during Phase 1 clarification are integrated into this blueprint:
> - **IPC Protocol**: Structured JSON protocol communicating over standard input and standard output streams (`stdin`/`stdout`).
> - **Persistence Layer**: RFC 4180 compliant CSV storage with robust quote escaping, comma handling, and automatic schema initialization.
> - **Dual-Mode Experience**: Full standalone desktop codebase (C++ engine, Java Swing UI, build scripts, tests, viva guides) alongside an interactive web-based desktop simulator in AI Studio for instantaneous live demonstration.

---

## 1. Overview & Core Concept

TaskFlow is designed to showcase multi-language systems programming and desktop software engineering for college academic evaluation:

- **What It Does**: Enables students and professionals to organize tasks, calculate real-time completion analytics, filter by urgency and categories (College, Personal, Work, Projects, Other), detect overdue deadlines, and safely persist data without external cloud dependencies.
- **Target Audience & Persona**: College examiners, engineering professors, and computer science students needing a verifiable demonstration of C++ algorithmic performance coupled with Java OOP architecture.
- **Key Value**: Demonstrates genuine Inter-Process Communication (IPC) via Java `ProcessBuilder`, streaming JSON commands to a compiled C++17 engine responsible for sorting algorithms, deadline math, priority scoring, and aggregate metrics.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Startup & Welcome**: Checks for existing task records in `data/tasks.csv`. If empty, offers a one-click "Load Academic Sample Tasks" action populated with realistic college deadlines.
2. **Dashboard Overview**: Displays real-time productivity statistics (Total Tasks, Completed, Pending, Overdue, and visual percentage progress), alongside high-priority items and today's deadlines.
3. **Task Management (Create / Edit / Delete)**: Modal dialog with validation (required non-blank titles, date bounds, priority selectors). Instant recalculation via the C++ engine upon saving.
4. **Search, Filter & Sort**: Live search by keyword; filter by Category, Priority, and Status; sort by Due Date, Priority Rank, or Creation Order.
5. **Presentation & Viva Hub**: Dedicated documentation tab and interactive demonstration controls to display live IPC requests, inspect C++ process health, view system architecture, and generate presentation materials.

### Visual Identity & Theme
- **Color Palette**: Dark charcoal canvas (`#12141A` / `#1A1D24`), warm amber and orange accents (`#F59E0B` and `#EA580C`), structural slate borders (`#2A2F3B`), and soft ivory typography (`#F1F5F9`).
- **Typography & Scale**: Primary headings and navigation in `Plus Jakarta Sans` / `Outfit`; data metrics and timestamps in tabular monospace (`JetBrains Mono` / `tabular-nums`).
- **Component Styling**: Clean single-elevation cards with hairline borders (`1px solid #2A2F3B`), zero-pill metadata using subtle dot separators (`·`), and responsive fluid resizing without layout clipping.
- **Motion & Feedback**: Immediate state transitions under 150ms, confirmation prompts before destructive actions (delete, clear completed), and subtle inline validation cues.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: JSON Protocol over Standard Streams (IPC)
- **Chosen Approach**: Java spawns the C++ task engine via `ProcessBuilder`, streams a command object with task payload via `stdin`, and reads the JSON response from `stdout`.
- **Why**: Clean separation of concerns, human-readable during live viva demonstrations, language-agnostic serialization, and easy verification using standard I/O testing tools.
- **Alternatives Considered**: Raw binary memory mapping (complex and platform-dependent) or command-line argument lists (constrained by shell argument length limits).

### Decision 2: RFC 4180 CSV Storage Engine
- **Chosen Approach**: Custom RFC 4180 compliant CSV parser and serializer in Java with proper handling of commas, quotes, and newlines in task descriptions.
- **Why**: Allows easy inspection in Excel or Notepad during college grading, does not require external third-party JAR dependencies, and guarantees file integrity across app restarts.
- **Alternatives Considered**: SQLite (requires native JNI drivers or external JARs) or basic string splitting (fragile and prone to data corruption).

### Decision 3: Dual-Platform Delivery (Desktop & Interactive Web Preview)
- **Chosen Approach**: The workspace includes the complete C++17 engine code (`cpp-engine/`), Java 17 Swing code (`java-app/`), automated unit tests, build scripts (`scripts/build.bat`, `run.bat`, `setup-and-run.bat`, `Makefile`), and comprehensive academic reports. Simultaneously, the web preview provides an interactive visual dashboard matching Java Swing's exact UX, with real-time IPC logging and project export capabilities.
- **Why**: Ensures immediate browser previewing in AI Studio while guaranteeing ready-to-run Windows batch scripts and Linux Makefile for tomorrow's presentation.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      TASKFLOW ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │             Java 17 Swing Desktop Client                │   │
│   │                                                         │   │
│   │  ┌──────────────┐   ┌──────────────┐   ┌─────────────┐  │   │
│   │  │  Dashboard   │   │  Task List   │   │ Add / Edit  │  │   │
│   │  │     View     │   │     View     │   │   Dialog    │  │   │
│   │  └──────┬───────┘   └──────┬───────┘   └──────┬──────┘  │   │
│   │         └──────────────────┼──────────────────┘         │   │
│   │                            ▼                            │   │
│   │                 ┌──────────────────────┐                │   │
│   │                 │     TaskService      │                │   │
│   │                 └──────────┬───────────┘                │   │
│   │            ┌───────────────┴───────────────┐            │   │
│   │            ▼                               ▼            │   │
│   │   ┌─────────────────┐             ┌─────────────────┐   │   │
│   │   │   TaskStorage   │             │   CppEngineIPC  │   │   │
│   │   │   (RFC 4180)    │             │ (ProcessBuilder)│   │   │
│   │   └────────┬────────┘             └────────┬────────┘   │   │
│   └────────────┼───────────────────────────────┼────────────┘   │
│                ▼                               │                │
│       ┌─────────────────┐                      │                │
│       │  data/tasks.csv │                      │ stdin / stdout │
│       └─────────────────┘                      │ JSON Stream    │
│                                                ▼                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │             C++17 Standalone Task Engine                │   │
│   │                                                         │   │
│   │  ┌─────────────────┐  ┌────────────────┐  ┌──────────┐  │   │
│   │  │ Priority Ranker │  │ Sort & Filter  │  │ Deadline │  │   │
│   │  │   & Statistics  │  │   Algorithms   │  │ & Overdue│  │   │
│   │  └─────────────────┘  └────────────────┘  └──────────┘  │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Schema & Fields
| Field Name | Type | Constraints / Format | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Non-empty UUID/Timestamp | Unique task identifier |
| `title` | String | 1–100 chars, required | Task headline |
| `description` | String | Escaped text, optional | Detailed task notes |
| `category` | Enum | College, Personal, Work, Projects, Other | Organization bucket |
| `priority` | Enum | High, Medium, Low | Urgency weight for sorting |
| `dueDate` | String | YYYY-MM-DD format | Target completion deadline |
| `completed` | Boolean | true / false | Task status |
| `createdAt` | String | ISO 8601 timestamp | Audit and ordering record |

### Component Hierarchy & State Transitions
- **View Layer**:
  - `MainWindow`: Top bar, collapsible sidebar navigation, central card deck.
  - `DashboardPanel`: Metric cards, deadline warnings, quick creation trigger.
  - `TasksPanel`: Search bar, multi-criteria filter tabs, task table/card list with inline actions.
  - `TaskDialog`: Form validation with instant feedback on required fields and date formats.
  - `PresentationPanel`: Architecture walkthrough, viva Q&A viewer, and IPC diagnostic logs.
- **Service Layer**:
  - `TaskService`: Mediates between UI events, storage commits, and C++ engine queries.
  - `CppEngineClient`: Manages process lifecycle, handles executable auto-detection, and parses engine outputs.
  - `TaskRepository`: Manages atomic file operations on `tasks.csv` with backup resilience.

---

## 5. Verification & Testing Strategy

1. **Compilation Verification**:
   - Compile C++ engine using `g++ -std=c++17` and CMake on Linux/Windows.
   - Compile Java application using standard `javac -d bin`.
2. **Automated Unit Testing**:
   - C++ engine test suite covering priority calculation, date parsing, sorting algorithms, and invalid payload handling.
   - Java test suite validating RFC 4180 CSV serialization, input constraints, and IPC failover.
3. **End-to-End Demonstration Verification**:
   - Sample data initialization, live task addition, priority recalculation, overdue detection, data persistence across restarts, and full viva documentation package.
