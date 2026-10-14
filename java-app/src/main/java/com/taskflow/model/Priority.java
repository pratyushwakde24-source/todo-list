package com.taskflow.model;

public enum Priority {
    HIGH("High", 3),
    MEDIUM("Medium", 2),
    LOW("Low", 1);

    private final String displayName;
    private final int rank;

    Priority(String displayName, int rank) {
        this.displayName = displayName;
        this.rank = rank;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getRank() {
        return rank;
    }

    public static Priority fromString(String text) {
        if (text == null) return MEDIUM;
        String trimmed = text.trim();
        for (Priority p : Priority.values()) {
            if (p.displayName.equalsIgnoreCase(trimmed) || p.name().equalsIgnoreCase(trimmed)) {
                return p;
            }
        }
        return MEDIUM;
    }

    @Override
    public String toString() {
        return displayName;
    }
}
