package com.taskflow.service;

import com.taskflow.integration.CppEngineClient;
import com.taskflow.model.Category;
import com.taskflow.model.DashboardStats;
import com.taskflow.model.Priority;
import com.taskflow.model.Task;
import com.taskflow.storage.TaskRepository;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class TaskService {

    private final TaskRepository repository;
    private final CppEngineClient engineClient;
    private final List<TaskChangeListener> listeners = new ArrayList<>();

    public interface TaskChangeListener {
        void onTasksChanged();
    }

    public TaskService(TaskRepository repository, CppEngineClient engineClient) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
        this.engineClient = Objects.requireNonNull(engineClient, "engineClient must not be null");
    }

    public void addChangeListener(TaskChangeListener listener) {
        if (listener != null) {
            listeners.add(listener);
        }
    }

    private void notifyListeners() {
        for (TaskChangeListener l : listeners) {
            try {
                l.onTasksChanged();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    public List<Task> getAllTasks() {
        try {
            return repository.findAll();
        } catch (IOException e) {
            System.err.println("[TaskService] Error reading tasks: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public Optional<Task> getTaskById(String id) {
        try {
            return repository.findById(id);
        } catch (IOException e) {
            return Optional.empty();
        }
    }

    public Task createTask(String title, String description, Category category, Priority priority, String dueDate) throws ValidationException {
        validateInputs(title, dueDate);

        Task task = new Task(title.trim(), description != null ? description.trim() : "",
                category != null ? category : Category.OTHER,
                priority != null ? priority : Priority.MEDIUM,
                dueDate != null ? dueDate.trim() : "");

        try {
            repository.save(task);
            notifyListeners();
            return task;
        } catch (IOException e) {
            throw new RuntimeException("Failed to persist task: " + e.getMessage(), e);
        }
    }

    public Task updateTask(String id, String title, String description, Category category, Priority priority, String dueDate, boolean completed) throws ValidationException {
        validateInputs(title, dueDate);

        Optional<Task> existingOpt = getTaskById(id);
        if (existingOpt.isEmpty()) {
            throw new ValidationException("Task with ID " + id + " does not exist.");
        }

        Task task = existingOpt.get();
        task.setTitle(title.trim());
        task.setDescription(description != null ? description.trim() : "");
        task.setCategory(category != null ? category : Category.OTHER);
        task.setPriority(priority != null ? priority : Priority.MEDIUM);
        task.setDueDate(dueDate != null ? dueDate.trim() : "");
        task.setCompleted(completed);

        try {
            repository.save(task);
            notifyListeners();
            return task;
        } catch (IOException e) {
            throw new RuntimeException("Failed to update task: " + e.getMessage(), e);
        }
    }

    public boolean deleteTask(String id) {
        try {
            boolean deleted = repository.deleteById(id);
            if (deleted) {
                notifyListeners();
            }
            return deleted;
        } catch (IOException e) {
            System.err.println("[TaskService] Failed to delete task: " + e.getMessage());
            return false;
        }
    }

    public boolean toggleTaskCompletion(String id) {
        Optional<Task> opt = getTaskById(id);
        if (opt.isPresent()) {
            Task t = opt.get();
            t.setCompleted(!t.isCompleted());
            try {
                repository.save(t);
                notifyListeners();
                return true;
            } catch (IOException e) {
                System.err.println("[TaskService] Failed to toggle completion: " + e.getMessage());
            }
        }
        return false;
    }

    public int clearCompletedTasks() {
        List<Task> all = getAllTasks();
        List<Task> remaining = all.stream().filter(t -> !t.isCompleted()).collect(Collectors.toList());
        int removedCount = all.size() - remaining.size();
        if (removedCount > 0) {
            try {
                repository.saveAll(remaining);
                notifyListeners();
            } catch (IOException e) {
                System.err.println("[TaskService] Failed to clear completed tasks: " + e.getMessage());
            }
        }
        return removedCount;
    }

    public DashboardStats getDashboardStats() {
        List<Task> tasks = getAllTasks();
        String today = LocalDate.now().toString();
        return engineClient.calculateStatistics(tasks, today);
    }

    public CppEngineClient getEngineClient() {
        return engineClient;
    }

    public List<Task> getHighPriorityPendingTasks(int limit) {
        String today = LocalDate.now().toString();
        return getAllTasks().stream()
                .filter(t -> !t.isCompleted() && t.getPriority() == Priority.HIGH)
                .sorted(Comparator.comparing(Task::getDueDate, Comparator.nullsLast(String::compareTo)))
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<Task> getUpcomingDeadlines(int limit) {
        String today = LocalDate.now().toString();
        return getAllTasks().stream()
                .filter(t -> !t.isCompleted() && t.getDueDate() != null && !t.getDueDate().isEmpty())
                .sorted(Comparator.comparing(Task::getDueDate))
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<Task> filterAndSortTasks(String category, String priority, String status, String searchQuery, String sortOrder) {
        List<Task> tasks = getAllTasks();
        String today = LocalDate.now().toString();

        return tasks.stream()
                .filter(t -> {
                    // Category
                    if (category != null && !category.equalsIgnoreCase("ALL")) {
                        if (!t.getCategory().name().equalsIgnoreCase(category) &&
                            !t.getCategory().getDisplayName().equalsIgnoreCase(category)) {
                            return false;
                        }
                    }
                    // Priority
                    if (priority != null && !priority.equalsIgnoreCase("ALL")) {
                        if (!t.getPriority().name().equalsIgnoreCase(priority) &&
                            !t.getPriority().getDisplayName().equalsIgnoreCase(priority)) {
                            return false;
                        }
                    }
                    // Status
                    if (status != null && !status.equalsIgnoreCase("ALL")) {
                        if (status.equalsIgnoreCase("COMPLETED") && !t.isCompleted()) return false;
                        if (status.equalsIgnoreCase("PENDING") && t.isCompleted()) return false;
                        if (status.equalsIgnoreCase("OVERDUE") && !t.isOverdue(today)) return false;
                        if (status.equalsIgnoreCase("DUE_TODAY") && !t.isDueToday(today)) return false;
                    }
                    // Search query
                    if (searchQuery != null && !searchQuery.trim().isEmpty()) {
                        String q = searchQuery.toLowerCase().trim();
                        boolean inTitle = t.getTitle().toLowerCase().contains(q);
                        boolean inDesc = t.getDescription().toLowerCase().contains(q);
                        if (!inTitle && !inDesc) return false;
                    }
                    return true;
                })
                .sorted((a, b) -> {
                    if ("DUE_DATE_ASC".equalsIgnoreCase(sortOrder)) {
                        if (a.getDueDate().isEmpty() && b.getDueDate().isEmpty()) return 0;
                        if (a.getDueDate().isEmpty()) return 1;
                        if (b.getDueDate().isEmpty()) return -1;
                        return a.getDueDate().compareTo(b.getDueDate());
                    } else if ("DUE_DATE_DESC".equalsIgnoreCase(sortOrder)) {
                        if (a.getDueDate().isEmpty() && b.getDueDate().isEmpty()) return 0;
                        if (a.getDueDate().isEmpty()) return 1;
                        if (b.getDueDate().isEmpty()) return -1;
                        return b.getDueDate().compareTo(a.getDueDate());
                    } else if ("PRIORITY_DESC".equalsIgnoreCase(sortOrder)) {
                        int rA = a.getPriority().getRank();
                        int rB = b.getPriority().getRank();
                        if (rA != rB) return Integer.compare(rB, rA);
                        return a.getDueDate().compareTo(b.getDueDate());
                    } else if ("PRIORITY_ASC".equalsIgnoreCase(sortOrder)) {
                        int rA = a.getPriority().getRank();
                        int rB = b.getPriority().getRank();
                        if (rA != rB) return Integer.compare(rA, rB);
                        return a.getDueDate().compareTo(b.getDueDate());
                    } else if ("TITLE_ASC".equalsIgnoreCase(sortOrder)) {
                        return a.getTitle().compareToIgnoreCase(b.getTitle());
                    } else {
                        // CREATED_AT_DESC default
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    }
                })
                .collect(Collectors.toList());
    }

    public void loadSamplePresentationTasks() {
        LocalDate now = LocalDate.now();
        List<Task> samples = Arrays.asList(
                new Task("Complete Data Structures assignment", "Implement Red-Black tree deletion and benchmark search latency.", Category.COLLEGE, Priority.HIGH, now.plusDays(1).toString()),
                new Task("Prepare Java practical demonstration", "Practice ProcessBuilder IPC explanation and RFC 4180 CSV parser walkthrough.", Category.COLLEGE, Priority.MEDIUM, now.toString()),
                new Task("Submit Final Project Report", "Compile IEEE format documentation, architecture diagrams, and test results.", Category.PROJECTS, Priority.HIGH, now.plusDays(3).toString()),
                new Task("Review OS synchronization lectures", "Semaphores, mutex locks, and inter-process message passing mechanisms.", Category.COLLEGE, Priority.MEDIUM, now.plusDays(4).toString()),
                new Task("Organize personal study notes", "Sort semester revision flashcards into binders.", Category.PERSONAL, Priority.LOW, now.plusDays(7).toString()),
                new Task("Submit Weekly Timesheet", "Log research lab assistant hours for the academic week.", Category.WORK, Priority.MEDIUM, now.minusDays(1).toString()) // overdue for demo!
        );

        try {
            repository.saveAll(samples);
            notifyListeners();
            System.out.println("[TaskService] Loaded " + samples.size() + " academic demonstration tasks.");
        } catch (IOException e) {
            System.err.println("[TaskService] Failed to load sample tasks: " + e.getMessage());
        }
    }

    private void validateInputs(String title, String dueDate) throws ValidationException {
        List<String> errors = new ArrayList<>();

        if (title == null || title.trim().isEmpty()) {
            errors.add("Task title is required and cannot be blank.");
        } else if (title.trim().length() > 150) {
            errors.add("Task title must be 150 characters or fewer.");
        }

        if (dueDate != null && !dueDate.trim().isEmpty()) {
            String trimmedDate = dueDate.trim();
            if (!Pattern.matches("^\\d{4}-\\d{2}-\\d{2}$", trimmedDate)) {
                errors.add("Due date must be in YYYY-MM-DD format (e.g., 2026-10-18).");
            } else {
                try {
                    LocalDate.parse(trimmedDate);
                } catch (DateTimeParseException e) {
                    errors.add("Due date represents an invalid calendar date.");
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }
    }
}
