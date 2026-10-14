package com.taskflow.storage;

import com.taskflow.model.Category;
import com.taskflow.model.Priority;
import com.taskflow.model.Task;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

/**
 * RFC 4180 compliant CSV persistence for TaskFlow tasks.
 * Handles embedded commas, double-quote escaping (""), and multiline descriptions.
 */
public class CsvTaskRepository implements TaskRepository {

    private final Path filePath;
    private static final String CSV_HEADER = "id,title,description,category,priority,dueDate,completed,createdAt";

    public CsvTaskRepository(String filePathStr) {
        this.filePath = Paths.get(filePathStr);
        ensureFileExists();
    }

    private synchronized void ensureFileExists() {
        try {
            if (filePath.getParent() != null) {
                Files.createDirectories(filePath.getParent());
            }
            if (!Files.exists(filePath)) {
                Files.writeString(filePath, CSV_HEADER + "\n", StandardCharsets.UTF_8, StandardOpenOption.CREATE);
            }
        } catch (IOException e) {
            System.err.println("[TaskFlow Storage] Warning: Could not initialize data file: " + e.getMessage());
        }
    }

    @Override
    public synchronized List<Task> findAll() throws IOException {
        if (!Files.exists(filePath)) {
            return new ArrayList<>();
        }

        List<Task> tasks = new ArrayList<>();
        List<List<String>> records = parseCsv(filePath);

        boolean first = true;
        for (List<String> row : records) {
            if (row.isEmpty()) continue;
            // Skip header row if present
            if (first) {
                first = false;
                if (!row.isEmpty() && "id".equalsIgnoreCase(row.get(0).trim())) {
                    continue;
                }
            }

            try {
                String id = row.size() > 0 ? row.get(0).trim() : UUID.randomUUID().toString();
                String title = row.size() > 1 ? row.get(1) : "Untitled";
                String description = row.size() > 2 ? row.get(2) : "";
                Category category = row.size() > 3 ? Category.fromString(row.get(3)) : Category.OTHER;
                Priority priority = row.size() > 4 ? Priority.fromString(row.get(4)) : Priority.MEDIUM;
                String dueDate = row.size() > 5 ? row.get(5).trim() : "";
                boolean completed = row.size() > 6 && Boolean.parseBoolean(row.get(6).trim());
                String createdAt = row.size() > 7 ? row.get(7).trim() : "";

                Task task = new Task(id, title, description, category, priority, dueDate, completed, createdAt);
                tasks.add(task);
            } catch (Exception ex) {
                System.err.println("[TaskFlow Storage] Skipping malformed CSV row: " + ex.getMessage());
            }
        }

        return tasks;
    }

    @Override
    public synchronized Optional<Task> findById(String id) throws IOException {
        return findAll().stream()
                .filter(t -> t.getId().equals(id))
                .findFirst();
    }

    @Override
    public synchronized void save(Task task) throws IOException {
        List<Task> current = findAll();
        boolean replaced = false;
        for (int i = 0; i < current.size(); i++) {
            if (current.get(i).getId().equals(task.getId())) {
                current.set(i, task);
                replaced = true;
                break;
            }
        }
        if (!replaced) {
            current.add(task);
        }
        saveAll(current);
    }

    @Override
    public synchronized void saveAll(List<Task> tasks) throws IOException {
        if (filePath.getParent() != null) {
            Files.createDirectories(filePath.getParent());
        }

        Path tempFile = filePath.resolveSibling(filePath.getFileName().toString() + ".tmp");
        try (BufferedWriter writer = Files.newBufferedWriter(tempFile, StandardCharsets.UTF_8,
                StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)) {

            writer.write(CSV_HEADER);
            writer.newLine();

            for (Task t : tasks) {
                writer.write(escapeCell(t.getId()) + ",");
                writer.write(escapeCell(t.getTitle()) + ",");
                writer.write(escapeCell(t.getDescription()) + ",");
                writer.write(escapeCell(t.getCategory().name()) + ",");
                writer.write(escapeCell(t.getPriority().name()) + ",");
                writer.write(escapeCell(t.getDueDate()) + ",");
                writer.write(t.isCompleted() + ",");
                writer.write(escapeCell(t.getCreatedAt()));
                writer.newLine();
            }
        }

        // Atomic file move to prevent partial writes
        Files.move(tempFile, filePath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
    }

    @Override
    public synchronized boolean deleteById(String id) throws IOException {
        List<Task> current = findAll();
        boolean removed = current.removeIf(t -> t.getId().equals(id));
        if (removed) {
            saveAll(current);
        }
        return removed;
    }

    @Override
    public synchronized void deleteAll() throws IOException {
        saveAll(new ArrayList<>());
    }

    // --- RFC 4180 Serialization Helpers ---

    private static String escapeCell(String value) {
        if (value == null) return "";
        boolean containsSpecial = value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r");
        if (!containsSpecial) {
            return value;
        }
        // RFC 4180: double internal quotes and enclose in quotes
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    /**
     * RFC 4180 compliant CSV state machine parser supporting quotes, commas, newlines.
     */
    public static List<List<String>> parseCsv(Path path) throws IOException {
        List<List<String>> rows = new ArrayList<>();
        if (!Files.exists(path)) return rows;

        String content = Files.readString(path, StandardCharsets.UTF_8);
        List<String> currentRow = new ArrayList<>();
        StringBuilder currentCell = new StringBuilder();

        boolean inQuotes = false;
        int len = content.length();

        for (int i = 0; i < len; i++) {
            char c = content.charAt(i);

            if (inQuotes) {
                if (c == '"') {
                    // Check for escaped quote ("")
                    if (i + 1 < len && content.charAt(i + 1) == '"') {
                        currentCell.append('"');
                        i++; // skip second quote
                    } else {
                        inQuotes = false;
                    }
                } else {
                    currentCell.append(c);
                }
            } else {
                if (c == '"') {
                    inQuotes = true;
                } else if (c == ',') {
                    currentRow.add(currentCell.toString());
                    currentCell.setLength(0);
                } else if (c == '\r') {
                    // Check for CRLF
                    if (i + 1 < len && content.charAt(i + 1) == '\n') {
                        i++;
                    }
                    currentRow.add(currentCell.toString());
                    currentCell.setLength(0);
                    rows.add(new ArrayList<>(currentRow));
                    currentRow.clear();
                } else if (c == '\n') {
                    currentRow.add(currentCell.toString());
                    currentCell.setLength(0);
                    rows.add(new ArrayList<>(currentRow));
                    currentRow.clear();
                } else {
                    currentCell.append(c);
                }
            }
        }

        if (currentCell.length() > 0 || !currentRow.isEmpty()) {
            currentRow.add(currentCell.toString());
            rows.add(currentRow);
        }

        return rows;
    }
}
