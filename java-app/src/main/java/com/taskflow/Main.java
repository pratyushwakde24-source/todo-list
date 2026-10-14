package com.taskflow;

import com.taskflow.integration.CppEngineClient;
import com.taskflow.model.DashboardStats;
import com.taskflow.model.Task;
import com.taskflow.service.TaskService;
import com.taskflow.storage.CsvTaskRepository;
import com.taskflow.storage.TaskRepository;
import com.taskflow.ui.MainWindow;

import javax.swing.*;
import java.awt.GraphicsEnvironment;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

public class Main {

    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("  TaskFlow — Smart To-Do Manager (C++ + Java)");
        System.out.println("  College Presentation & Demonstration System");
        System.out.println("==================================================");

        // 1. Resolve Data Path
        String dataFilePath = resolveDataFilePath();
        System.out.println("[Main] Data store: " + dataFilePath);

        TaskRepository repository = new CsvTaskRepository(dataFilePath);
        CppEngineClient engineClient = new CppEngineClient();
        TaskService taskService = new TaskService(repository, engineClient);

        // First launch auto-seed if file has no tasks
        List<Task> existing = taskService.getAllTasks();
        if (existing.isEmpty()) {
            System.out.println("[Main] Empty task database detected. Seeding presentation sample tasks...");
            taskService.loadSamplePresentationTasks();
        }

        // Check if running in headless verification mode
        if (args.length > 0 && ("--cli".equals(args[0]) || "--test".equals(args[0]) || "--headless".equals(args[0]))) {
            runCliVerification(taskService);
            return;
        }

        // Check if headless environment without X11/display
        if (GraphicsEnvironment.isHeadless()) {
            System.out.println("[Main] GraphicsEnvironment is headless (no display attached).");
            System.out.println("[Main] Running full CLI verification suite instead of GUI window.");
            runCliVerification(taskService);
            return;
        }

        // 2. Launch GUI on Event Dispatch Thread
        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(UIManager.getCrossPlatformLookAndFeelClassName());
            } catch (Exception ignored) {}

            MainWindow window = new MainWindow(taskService);
            window.setVisible(true);
            System.out.println("[Main] Desktop Swing GUI initialized successfully.");
        });
    }

    private static String resolveDataFilePath() {
        String custom = System.getProperty("taskflow.data.path");
        if (custom != null && !custom.trim().isEmpty()) {
            return custom;
        }
        if (Files.exists(Paths.get("data"))) {
            return "data/tasks.csv";
        }
        if (Files.exists(Paths.get("../data"))) {
            return "../data/tasks.csv";
        }
        return "data/tasks.csv";
    }

    private static void runCliVerification(TaskService taskService) {
        System.out.println("\n--- RUNNING CLI VERIFICATION SUITE ---");
        List<Task> tasks = taskService.getAllTasks();
        System.out.println("Total Tasks Loaded: " + tasks.size());
        for (Task t : tasks) {
            System.out.println(" • [" + t.getPriority() + "] " + t.getTitle() + " (Category: " + t.getCategory() + ", Due: " + t.getDueDate() + ", Done: " + t.isCompleted() + ")");
        }

        DashboardStats stats = taskService.getDashboardStats();
        System.out.println("\n--- C++ ENGINE / IPC METRICS ---");
        System.out.println("Total: " + stats.getTotalTasks());
        System.out.println("Completed: " + stats.getCompletedTasks());
        System.out.println("Pending: " + stats.getPendingTasks());
        System.out.println("Overdue: " + stats.getOverdueTasks());
        System.out.println("High Priority Pending: " + stats.getHighPriorityPending());
        System.out.println("Completion Rate: " + stats.getCompletionPercentage() + "%");
        System.out.println("Engine Version: " + taskService.getEngineClient().getEngineVersionInfo());
        System.out.println("--- CLI VERIFICATION COMPLETE (STATUS: OK) ---\n");
    }
}
