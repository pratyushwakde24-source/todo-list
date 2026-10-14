package com.taskflow.model;

public class DashboardStats {
    private final int totalTasks;
    private final int completedTasks;
    private final int pendingTasks;
    private final int overdueTasks;
    private final int dueTodayTasks;
    private final int highPriorityPending;
    private final double completionPercentage;

    public DashboardStats(int totalTasks, int completedTasks, int pendingTasks, int overdueTasks, int dueTodayTasks, int highPriorityPending, double completionPercentage) {
        this.totalTasks = totalTasks;
        this.completedTasks = completedTasks;
        this.pendingTasks = pendingTasks;
        this.overdueTasks = overdueTasks;
        this.dueTodayTasks = dueTodayTasks;
        this.highPriorityPending = highPriorityPending;
        this.completionPercentage = completionPercentage;
    }

    public static DashboardStats empty() {
        return new DashboardStats(0, 0, 0, 0, 0, 0, 0.0);
    }

    public int getTotalTasks() { return totalTasks; }
    public int getCompletedTasks() { return completedTasks; }
    public int getPendingTasks() { return pendingTasks; }
    public int getOverdueTasks() { return overdueTasks; }
    public int getDueTodayTasks() { return dueTodayTasks; }
    public int getHighPriorityPending() { return highPriorityPending; }
    public double getCompletionPercentage() { return completionPercentage; }

    @Override
    public String toString() {
        return "DashboardStats{" +
                "total=" + totalTasks +
                ", completed=" + completedTasks +
                ", pending=" + pendingTasks +
                ", overdue=" + overdueTasks +
                ", dueToday=" + dueTodayTasks +
                ", highPriorityPending=" + highPriorityPending +
                ", completionPct=" + completionPercentage + "%" +
                '}';
    }
}
