package com.taskflow.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import java.util.UUID;

public class Task {
    private String id;
    private String title;
    private String description;
    private Category category;
    private Priority priority;
    private String dueDate; // YYYY-MM-DD format
    private boolean completed;
    private String createdAt;

    public Task() {
        this.id = UUID.randomUUID().toString();
        this.category = Category.OTHER;
        this.priority = Priority.MEDIUM;
        this.completed = false;
        this.createdAt = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }

    public Task(String title, String description, Category category, Priority priority, String dueDate) {
        this();
        this.title = title;
        this.description = description != null ? description : "";
        this.category = category != null ? category : Category.OTHER;
        this.priority = priority != null ? priority : Priority.MEDIUM;
        this.dueDate = dueDate != null ? dueDate : "";
    }

    public Task(String id, String title, String description, Category category, Priority priority, String dueDate, boolean completed, String createdAt) {
        this.id = id != null ? id : UUID.randomUUID().toString();
        this.title = title;
        this.description = description != null ? description : "";
        this.category = category != null ? category : Category.OTHER;
        this.priority = priority != null ? priority : Priority.MEDIUM;
        this.dueDate = dueDate != null ? dueDate : "";
        this.completed = completed;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public boolean isOverdue(String referenceDate) {
        if (completed || dueDate == null || dueDate.isEmpty()) return false;
        return dueDate.compareTo(referenceDate) < 0;
    }

    public boolean isDueToday(String referenceDate) {
        if (completed || dueDate == null || dueDate.isEmpty()) return false;
        return dueDate.equals(referenceDate);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Task)) return false;
        Task task = (Task) o;
        return Objects.equals(id, task.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Task{" +
                "id='" + id + '\'' +
                ", title='" + title + '\'' +
                ", category=" + category +
                ", priority=" + priority +
                ", dueDate='" + dueDate + '\'' +
                ", completed=" + completed +
                '}';
    }
}
