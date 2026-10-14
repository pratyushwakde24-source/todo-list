package com.taskflow.integration;

import com.taskflow.model.DashboardStats;
import com.taskflow.model.Priority;
import com.taskflow.model.Task;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Inter-Process Communication (IPC) client communicating with C++ Task Engine via ProcessBuilder.
 * Sends JSON requests over stdin and parses JSON responses from stdout.
 */
public class CppEngineClient {

    private String executablePath;
    private boolean engineAvailable = false;
    private String engineVersionInfo = "Not Detected";

    public CppEngineClient() {
        locateEngineExecutable();
    }

    public synchronized void locateEngineExecutable() {
        String[] candidatePaths = {
                System.getProperty("taskflow.engine.path", ""),
                "../cpp-engine/build/bin/task_engine.exe",
                "../cpp-engine/build/bin/task_engine",
                "cpp-engine/build/bin/task_engine.exe",
                "cpp-engine/build/bin/task_engine",
                "bin/task_engine.exe",
                "bin/task_engine",
                "./task_engine.exe",
                "./task_engine",
                "../bin/task_engine.exe",
                "../bin/task_engine"
        };

        for (String candidate : candidatePaths) {
            if (candidate == null || candidate.trim().isEmpty()) continue;
            Path p = Paths.get(candidate);
            if (Files.exists(p) && Files.isRegularFile(p)) {
                this.executablePath = p.toAbsolutePath().toString();
                break;
            }
        }

        if (this.executablePath != null) {
            testEngineConnection();
        } else {
            this.engineAvailable = false;
            this.engineVersionInfo = "Engine executable not found (run build script to compile C++)";
            System.out.println("[CppEngineClient] Notice: C++ task_engine binary not found at default locations. Fallback calculations active.");
        }
    }

    private void testEngineConnection() {
        try {
            String response = executeCommand("{\"action\":\"PING\"}");
            if (response != null && response.contains("\"status\":\"OK\"")) {
                this.engineAvailable = true;
                this.engineVersionInfo = "C++17 Standalone Engine (Connected via ProcessBuilder IPC)";
                System.out.println("[CppEngineClient] C++ Engine detected & verified: " + executablePath);
            } else {
                this.engineAvailable = false;
                this.engineVersionInfo = "Engine connected but returned invalid ping response";
            }
        } catch (Exception ex) {
            this.engineAvailable = false;
            this.engineVersionInfo = "Failed to spawn C++ engine: " + ex.getMessage();
        }
    }

    public boolean isEngineAvailable() {
        return engineAvailable;
    }

    public String getEngineVersionInfo() {
        return engineVersionInfo;
    }

    public String getExecutablePath() {
        return executablePath != null ? executablePath : "None";
    }

    /**
     * Executes a JSON command through ProcessBuilder and captures stdout.
     */
    public synchronized String executeCommand(String jsonCommand) throws IOException, InterruptedException {
        if (executablePath == null) {
            throw new IOException("C++ engine executable path is not resolved.");
        }

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
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
                // In single-line JSON stream mode, the first valid response line is our JSON
                if (line.trim().startsWith("{") && line.trim().endsWith("}")) {
                    break;
                }
            }
        }

        boolean finished = process.waitFor(3, TimeUnit.SECONDS);
        if (!finished) {
            process.destroyForcibly();
            throw new IOException("C++ Engine process timed out after 3 seconds.");
        }

        return output.toString().trim();
    }

    /**
     * Delegates dashboard statistics calculation to C++ engine.
     */
    public DashboardStats calculateStatistics(List<Task> tasks, String todayDate) {
        if (todayDate == null || todayDate.isEmpty()) {
            todayDate = LocalDate.now().toString();
        }

        if (engineAvailable) {
            try {
                String jsonPayload = buildTaskPayloadJson("STATISTICS", tasks, todayDate);
                String response = executeCommand(jsonPayload);
                return parseStatsFromJson(response);
            } catch (Exception e) {
                System.err.println("[CppEngineClient] IPC error during statistics: " + e.getMessage() + ". Using Java fallback.");
            }
        }

        // Java Fallback Calculation if C++ is not yet compiled
        int total = tasks.size();
        int completed = 0;
        int pending = 0;
        int overdue = 0;
        int dueToday = 0;
        int highPriority = 0;

        for (Task t : tasks) {
            if (t.isCompleted()) {
                completed++;
            } else {
                pending++;
                if (t.getPriority() == Priority.HIGH) {
                    highPriority++;
                }
                if (t.isOverdue(todayDate)) {
                    overdue++;
                }
                if (t.isDueToday(todayDate)) {
                    dueToday++;
                }
            }
        }

        double pct = total > 0 ? (completed * 100.0) / total : 0.0;
        return new DashboardStats(total, completed, pending, overdue, dueToday, highPriority, pct);
    }

    private String buildTaskPayloadJson(String action, List<Task> tasks, String today) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"action\":\"").append(action).append("\",");
        sb.append("\"today\":\"").append(today).append("\",");
        sb.append("\"tasks\":[");
        for (int i = 0; i < tasks.size(); i++) {
            Task t = tasks.get(i);
            sb.append("{");
            sb.append("\"id\":\"").append(escapeJson(t.getId())).append("\",");
            sb.append("\"title\":\"").append(escapeJson(t.getTitle())).append("\",");
            sb.append("\"description\":\"").append(escapeJson(t.getDescription())).append("\",");
            sb.append("\"category\":\"").append(t.getCategory().name()).append("\",");
            sb.append("\"priority\":\"").append(t.getPriority().name()).append("\",");
            sb.append("\"dueDate\":\"").append(escapeJson(t.getDueDate())).append("\",");
            sb.append("\"completed\":").append(t.isCompleted()).append(",");
            sb.append("\"createdAt\":\"").append(escapeJson(t.getCreatedAt())).append("\"");
            sb.append("}");
            if (i < tasks.size() - 1) sb.append(",");
        }
        sb.append("]}");
        return sb.toString();
    }

    private DashboardStats parseStatsFromJson(String json) {
        try {
            int total = extractInt(json, "totalTasks");
            int completed = extractInt(json, "completedTasks");
            int pending = extractInt(json, "pendingTasks");
            int overdue = extractInt(json, "overdueTasks");
            int dueToday = extractInt(json, "dueTodayTasks");
            int highPriority = extractInt(json, "highPriorityPending");
            double pct = extractDouble(json, "completionPercentage");
            return new DashboardStats(total, completed, pending, overdue, dueToday, highPriority, pct);
        } catch (Exception e) {
            return DashboardStats.empty();
        }
    }

    private static int extractInt(String json, String key) {
        String needle = "\"" + key + "\":";
        int idx = json.indexOf(needle);
        if (idx == -1) return 0;
        int start = idx + needle.length();
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) {
            end++;
        }
        return Integer.parseInt(json.substring(start, end).trim());
    }

    private static double extractDouble(String json, String key) {
        String needle = "\"" + key + "\":";
        int idx = json.indexOf(needle);
        if (idx == -1) return 0.0;
        int start = idx + needle.length();
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '.' || json.charAt(end) == '-')) {
            end++;
        }
        return Double.parseDouble(json.substring(start, end).trim());
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
