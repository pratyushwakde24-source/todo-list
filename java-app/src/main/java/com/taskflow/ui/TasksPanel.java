package com.taskflow.ui;

import com.taskflow.model.Category;
import com.taskflow.model.Priority;
import com.taskflow.model.Task;
import com.taskflow.service.TaskService;

import javax.swing.*;
import javax.swing.border.CompoundBorder;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import java.awt.*;
import java.time.LocalDate;
import java.util.List;

public class TasksPanel extends JPanel implements TaskService.TaskChangeListener {

    private final TaskService taskService;
    private final MainWindow mainWindow;

    private JTextField searchField;
    private JComboBox<String> categoryFilter;
    private JComboBox<String> priorityFilter;
    private JComboBox<String> statusFilter;
    private JComboBox<String> sortOrderCombo;
    private JPanel taskListContainer;

    public TasksPanel(TaskService taskService, MainWindow mainWindow) {
        this.taskService = taskService;
        this.mainWindow = mainWindow;
        this.taskService.addChangeListener(this);

        setBackground(Theme.BG_DARK);
        setLayout(new BorderLayout(0, 16));
        setBorder(new EmptyBorder(24, 28, 24, 28));

        initUI();
        refreshTaskList();
    }

    private void initUI() {
        // --- Header and Toolbar ---
        JPanel topContainer = new JPanel();
        topContainer.setOpaque(false);
        topContainer.setLayout(new BoxLayout(topContainer, BoxLayout.Y_AXIS));

        // Title row
        JPanel titleRow = new JPanel(new BorderLayout());
        titleRow.setOpaque(false);

        JLabel title = new JLabel("All Tasks");
        title.setFont(Theme.FONT_HERO);
        title.setForeground(Theme.TEXT_PRIMARY);

        JPanel actionButtons = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        actionButtons.setOpaque(false);

        JButton clearCompletedBtn = Theme.createSecondaryButton("Clear Completed");
        clearCompletedBtn.addActionListener(e -> handleClearCompleted());

        JButton addTaskBtn = Theme.createPrimaryButton("+ Add Task");
        addTaskBtn.addActionListener(e -> mainWindow.openAddTaskDialog());

        actionButtons.add(clearCompletedBtn);
        actionButtons.add(addTaskBtn);

        titleRow.add(title, BorderLayout.WEST);
        titleRow.add(actionButtons, BorderLayout.EAST);
        topContainer.add(titleRow);
        topContainer.add(Box.createVerticalStrut(16));

        // Filters bar
        JPanel filtersBar = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 0));
        filtersBar.setOpaque(false);

        // Search Input
        searchField = new JTextField(16);
        searchField.setFont(Theme.FONT_BODY);
        searchField.setBackground(Theme.CARD_DARK);
        searchField.setForeground(Theme.TEXT_PRIMARY);
        searchField.setCaretColor(Theme.ACCENT_AMBER);
        searchField.setBorder(new CompoundBorder(
                new LineBorder(Theme.BORDER_COLOR, 1),
                new EmptyBorder(6, 10, 6, 10)
        ));
        searchField.setToolTipText("Search title or description...");
        searchField.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
            public void insertUpdate(javax.swing.event.DocumentEvent e) { refreshTaskList(); }
            public void removeUpdate(javax.swing.event.DocumentEvent e) { refreshTaskList(); }
            public void changedUpdate(javax.swing.event.DocumentEvent e) { refreshTaskList(); }
        });

        // Category Filter
        categoryFilter = new JComboBox<>(new String[]{"All Categories", "College", "Personal", "Work", "Projects", "Other"});
        styleComboBox(categoryFilter);
        categoryFilter.addActionListener(e -> refreshTaskList());

        // Priority Filter
        priorityFilter = new JComboBox<>(new String[]{"All Priorities", "High", "Medium", "Low"});
        styleComboBox(priorityFilter);
        priorityFilter.addActionListener(e -> refreshTaskList());

        // Status Filter
        statusFilter = new JComboBox<>(new String[]{"All Statuses", "Pending", "Completed", "Overdue", "Due Today"});
        styleComboBox(statusFilter);
        statusFilter.addActionListener(e -> refreshTaskList());

        // Sort Order
        sortOrderCombo = new JComboBox<>(new String[]{
                "Priority: High to Low",
                "Due Date: Nearest First",
                "Due Date: Furthest First",
                "Created: Newest First",
                "Title: Alphabetical"
        });
        styleComboBox(sortOrderCombo);
        sortOrderCombo.addActionListener(e -> refreshTaskList());

        filtersBar.add(new JLabel("Search:"));
        filtersBar.add(searchField);
        filtersBar.add(categoryFilter);
        filtersBar.add(priorityFilter);
        filtersBar.add(statusFilter);
        filtersBar.add(new JLabel("Sort:"));
        filtersBar.add(sortOrderCombo);

        // Format labels inside filtersBar
        for (Component c : filtersBar.getComponents()) {
            if (c instanceof JLabel) {
                c.setFont(Theme.FONT_SMALL);
                c.setForeground(Theme.TEXT_MUTED);
            }
        }

        topContainer.add(filtersBar);
        add(topContainer, BorderLayout.NORTH);

        // --- Task Cards List ---
        taskListContainer = new JPanel();
        taskListContainer.setOpaque(false);
        taskListContainer.setLayout(new BoxLayout(taskListContainer, BoxLayout.Y_AXIS));

        JScrollPane scrollPane = new JScrollPane(taskListContainer);
        scrollPane.setOpaque(false);
        scrollPane.getViewport().setOpaque(false);
        scrollPane.setBorder(null);
        scrollPane.getVerticalScrollBar().setUnitIncrement(16);

        add(scrollPane, BorderLayout.CENTER);
    }

    private void styleComboBox(JComboBox<String> cb) {
        cb.setFont(Theme.FONT_BODY);
        cb.setBackground(Theme.CARD_DARK);
        cb.setForeground(Theme.TEXT_PRIMARY);
        cb.setBorder(new LineBorder(Theme.BORDER_COLOR, 1));
        cb.setFocusable(false);
    }

    public void refreshTaskList() {
        taskListContainer.removeAll();

        String selectedCat = (String) categoryFilter.getSelectedItem();
        String catVal = "All Categories".equals(selectedCat) ? "ALL" : selectedCat;

        String selectedPri = (String) priorityFilter.getSelectedItem();
        String priVal = "All Priorities".equals(selectedPri) ? "ALL" : selectedPri;

        String selectedStat = (String) statusFilter.getSelectedItem();
        String statVal = "ALL";
        if ("Pending".equals(selectedStat)) statVal = "PENDING";
        else if ("Completed".equals(selectedStat)) statVal = "COMPLETED";
        else if ("Overdue".equals(selectedStat)) statVal = "OVERDUE";
        else if ("Due Today".equals(selectedStat)) statVal = "DUE_TODAY";

        String sortSelection = (String) sortOrderCombo.getSelectedItem();
        String sortCode = "CREATED_AT_DESC";
        if (sortSelection != null) {
            if (sortSelection.startsWith("Priority")) sortCode = "PRIORITY_DESC";
            else if (sortSelection.contains("Nearest")) sortCode = "DUE_DATE_ASC";
            else if (sortSelection.contains("Furthest")) sortCode = "DUE_DATE_DESC";
            else if (sortSelection.contains("Alphabetical")) sortCode = "TITLE_ASC";
        }

        String search = searchField.getText();

        List<Task> filtered = taskService.filterAndSortTasks(catVal, priVal, statVal, search, sortCode);

        if (filtered.isEmpty()) {
            JPanel emptyPanel = new JPanel();
            emptyPanel.setOpaque(false);
            emptyPanel.setLayout(new BoxLayout(emptyPanel, BoxLayout.Y_AXIS));
            emptyPanel.setBorder(new EmptyBorder(60, 0, 0, 0));

            JLabel emptyTitle = new JLabel("No tasks found matching current filters.");
            emptyTitle.setFont(Theme.FONT_HEADING);
            emptyTitle.setForeground(Theme.TEXT_MUTED);
            emptyTitle.setAlignmentX(Component.CENTER_ALIGNMENT);

            JLabel emptySub = new JLabel("Try broadening your search or click '+ Add Task' to create one.");
            emptySub.setFont(Theme.FONT_BODY);
            emptySub.setForeground(Theme.TEXT_MUTED);
            emptySub.setAlignmentX(Component.CENTER_ALIGNMENT);

            emptyPanel.add(emptyTitle);
            emptyPanel.add(Box.createVerticalStrut(8));
            emptyPanel.add(emptySub);
            taskListContainer.add(emptyPanel);
        } else {
            for (Task t : filtered) {
                taskListContainer.add(createTaskCard(t));
                taskListContainer.add(Box.createVerticalStrut(12));
            }
        }

        taskListContainer.revalidate();
        taskListContainer.repaint();
    }

    private JPanel createTaskCard(Task task) {
        JPanel card = new JPanel(new BorderLayout(16, 0));
        card.setBackground(Theme.PANEL_DARK);
        card.setBorder(Theme.createCardBorder());
        card.setMaximumSize(new Dimension(Integer.MAX_VALUE, 86));

        // Left: Completion Checkbox
        JCheckBox check = new JCheckBox();
        check.setSelected(task.isCompleted());
        check.setOpaque(false);
        check.setCursor(new Cursor(Cursor.HAND_CURSOR));
        check.addActionListener(e -> taskService.toggleTaskCompletion(task.getId()));
        card.add(check, BorderLayout.WEST);

        // Center: Details
        JPanel center = new JPanel();
        center.setOpaque(false);
        center.setLayout(new BoxLayout(center, BoxLayout.Y_AXIS));

        JLabel titleLbl = new JLabel(task.getTitle());
        titleLbl.setFont(Theme.FONT_SUBHEADING);
        if (task.isCompleted()) {
            titleLbl.setForeground(Theme.TEXT_MUTED);
        } else {
            titleLbl.setForeground(Theme.TEXT_PRIMARY);
        }

        String desc = task.getDescription();
        if (desc.length() > 90) {
            desc = desc.substring(0, 87) + "...";
        }
        JLabel descLbl = new JLabel(desc.isEmpty() ? "No description provided." : desc);
        descLbl.setFont(Theme.FONT_SMALL);
        descLbl.setForeground(Theme.TEXT_MUTED);

        // Metadata line
        String today = LocalDate.now().toString();
        boolean isOverdue = task.isOverdue(today);

        String metaText = task.getCategory().getDisplayName() + "  ·  "
                + "Priority: " + task.getPriority().getDisplayName() + "  ·  "
                + (task.getDueDate().isEmpty() ? "No deadline" : "Due: " + task.getDueDate())
                + (isOverdue ? " (OVERDUE)" : "");

        JLabel metaLbl = new JLabel(metaText);
        metaLbl.setFont(Theme.FONT_SMALL);
        if (isOverdue) {
            metaLbl.setForeground(Theme.STATUS_DANGER);
        } else {
            metaLbl.setForeground(Theme.TEXT_SECONDARY);
        }

        center.add(titleLbl);
        center.add(Box.createVerticalStrut(3));
        center.add(descLbl);
        center.add(Box.createVerticalStrut(4));
        center.add(metaLbl);

        card.add(center, BorderLayout.CENTER);

        // Right: Edit and Delete Buttons
        JPanel actions = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 12));
        actions.setOpaque(false);

        JButton editBtn = Theme.createSecondaryButton("Edit");
        editBtn.addActionListener(e -> mainWindow.openEditTaskDialog(task));

        JButton deleteBtn = Theme.createSecondaryButton("Delete");
        deleteBtn.setForeground(Theme.STATUS_DANGER);
        deleteBtn.addActionListener(e -> {
            int confirm = JOptionPane.showConfirmDialog(this,
                    "Are you sure you want to delete task:\n\"" + task.getTitle() + "\"?",
                    "Confirm Task Deletion", JOptionPane.YES_NO_OPTION, JOptionPane.WARNING_MESSAGE);
            if (confirm == JOptionPane.YES_OPTION) {
                taskService.deleteTask(task.getId());
            }
        });

        actions.add(editBtn);
        actions.add(deleteBtn);
        card.add(actions, BorderLayout.EAST);

        return card;
    }

    private void handleClearCompleted() {
        int confirm = JOptionPane.showConfirmDialog(this,
                "Are you sure you want to clear all completed tasks from storage?",
                "Clear Completed Tasks", JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE);
        if (confirm == JOptionPane.YES_OPTION) {
            int count = taskService.clearCompletedTasks();
            JOptionPane.showMessageDialog(this,
                    "Removed " + count + " completed task(s).",
                    "Tasks Cleared", JOptionPane.INFORMATION_MESSAGE);
        }
    }

    @Override
    public void onTasksChanged() {
        SwingUtilities.invokeLater(this::refreshTaskList);
    }
}
