package com.taskflow;

import com.taskflow.integration.CppEngineClient;
import com.taskflow.model.Category;
import com.taskflow.model.DashboardStats;
import com.taskflow.model.Priority;
import com.taskflow.model.Task;
import com.taskflow.service.TaskService;
import com.taskflow.service.ValidationException;
import com.taskflow.storage.CsvTaskRepository;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public class TaskServiceTest {

    public static void main(String[] args) {
        System.out.println("=== Running TaskFlow Java Automated Test Suite ===");
        try {
            Path tempDir = Files.createTempDirectory("taskflow_test");
            String testCsvPath = tempDir.resolve("test_tasks.csv").toString();

            CsvTaskRepository repo = new CsvTaskRepository(testCsvPath);
            CppEngineClient engineClient = new CppEngineClient();
            TaskService service = new TaskService(repo, engineClient);

            testTaskCreationAndValidation(service);
            testRfc4180SpecialCharacters(service, testCsvPath);
            testUpdateAndToggleCompletion(service);
            testFilteringAndSorting(service);
            testDeletion(service);
            testDashboardStats(service);

            System.out.println("=== ALL JAVA TESTS PASSED SUCCESSFULLY! ===");
        } catch (Exception e) {
            System.err.println("TEST SUITE FAILED: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static void testTaskCreationAndValidation(TaskService service) throws Exception {
        System.out.print("[Test] Task Creation & Input Validation: ");

        // Valid task
        Task t1 = service.createTask("Review Microprocessors", "Chapter 4 timing diagrams", Category.COLLEGE, Priority.HIGH, "2026-10-18");
        assert t1.getId() != null;
        assert "Review Microprocessors".equals(t1.getTitle());

        // Blank title validation failure
        boolean failedBlank = false;
        try {
            service.createTask("   ", "notes", Category.OTHER, Priority.LOW, "2026-10-20");
        } catch (ValidationException ve) {
            failedBlank = true;
        }
        assert failedBlank : "Should reject blank task title";

        // Invalid date format failure
        boolean failedDate = false;
        try {
            service.createTask("Valid Title", "notes", Category.OTHER, Priority.LOW, "18-10-2026");
        } catch (ValidationException ve) {
            failedDate = true;
        }
        assert failedDate : "Should reject invalid date format";

        System.out.println("PASSED");
    }

    private static void testRfc4180SpecialCharacters(TaskService service, String csvPath) throws Exception {
        System.out.print("[Test] RFC 4180 Comma & Quote Escaping: ");

        String specialDesc = "Includes commas, quotes \"hello\", and\nmultiple lines of notes.";
        Task t = service.createTask("Complex Task with \"Quotes\"", specialDesc, Category.PROJECTS, Priority.MEDIUM, "2026-10-25");

        // Verify loaded back identically from disk
        CsvTaskRepository newRepoInstance = new CsvTaskRepository(csvPath);
        Task reloaded = newRepoInstance.findById(t.getId()).orElseThrow();

        assert t.getTitle().equals(reloaded.getTitle()) : "Title corrupted during CSV reload";
        assert specialDesc.equals(reloaded.getDescription()) : "Multiline quoted description corrupted during CSV reload";

        System.out.println("PASSED");
    }

    private static void testUpdateAndToggleCompletion(TaskService service) throws Exception {
        System.out.print("[Test] Task Update & Completion Toggle: ");

        Task t = service.createTask("Test Toggle", "desc", Category.WORK, Priority.LOW, "2026-10-30");
        assert !t.isCompleted();

        service.toggleTaskCompletion(t.getId());
        Task updated = service.getTaskById(t.getId()).orElseThrow();
        assert updated.isCompleted() : "Task completion status should be true";

        service.updateTask(t.getId(), "Updated Title", "New Desc", Category.PERSONAL, Priority.HIGH, "2026-11-01", false);
        Task afterEdit = service.getTaskById(t.getId()).orElseThrow();
        assert "Updated Title".equals(afterEdit.getTitle());
        assert !afterEdit.isCompleted();

        System.out.println("PASSED");
    }

    private static void testFilteringAndSorting(TaskService service) {
        System.out.print("[Test] Category Filtering and Priority Sorting: ");

        List<Task> collegeOnly = service.filterAndSortTasks("COLLEGE", "ALL", "ALL", "", "PRIORITY_DESC");
        for (Task t : collegeOnly) {
            assert t.getCategory() == Category.COLLEGE;
        }

        List<Task> sortedByPriority = service.filterAndSortTasks("ALL", "ALL", "ALL", "", "PRIORITY_DESC");
        for (int i = 0; i < sortedByPriority.size() - 1; i++) {
            assert sortedByPriority.get(i).getPriority().getRank() >= sortedByPriority.get(i + 1).getPriority().getRank();
        }

        System.out.println("PASSED");
    }

    private static void testDeletion(TaskService service) {
        System.out.print("[Test] Task Deletion: ");

        Task t = service.getAllTasks().get(0);
        String id = t.getId();
        boolean deleted = service.deleteTask(id);
        assert deleted;
        assert service.getTaskById(id).isEmpty();

        System.out.println("PASSED");
    }

    private static void testDashboardStats(TaskService service) {
        System.out.print("[Test] Dashboard Statistics Computation: ");

        DashboardStats stats = service.getDashboardStats();
        assert stats.getTotalTasks() >= 0;
        assert stats.getCompletedTasks() >= 0;
        assert stats.getPendingTasks() >= 0;
        assert stats.getCompletionPercentage() >= 0.0 && stats.getCompletionPercentage() <= 100.0;

        System.out.println("PASSED");
    }
}
