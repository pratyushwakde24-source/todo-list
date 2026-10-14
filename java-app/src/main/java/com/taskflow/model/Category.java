package com.taskflow.model;

public enum Category {
    COLLEGE("College"),
    PERSONAL("Personal"),
    WORK("Work"),
    PROJECTS("Projects"),
    OTHER("Other");

    private final String displayName;

    Category(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static Category fromString(String text) {
        if (text == null) return OTHER;
        String trimmed = text.trim();
        for (Category c : Category.values()) {
            if (c.displayName.equalsIgnoreCase(trimmed) || c.name().equalsIgnoreCase(trimmed)) {
                return c;
            }
        }
        return OTHER;
    }

    @Override
    public String toString() {
        return displayName;
    }
}
