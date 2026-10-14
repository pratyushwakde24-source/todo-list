package com.taskflow.ui;

import com.taskflow.model.Task;
import com.taskflow.service.TaskService;

import javax.swing.*;
import javax.swing.border.CompoundBorder;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import java.awt.*;
import java.util.HashMap;
import java.util.Map;

public class MainWindow extends JFrame {

    private final TaskService taskService;
    private final CardLayout cardLayout;
    private final JPanel centerPanel;
    private final Map<String, JButton> navButtons = new HashMap<>();

    public static final String VIEW_DASHBOARD = "DASHBOARD";
    public static final String VIEW_TASKS = "TASKS";
    public static final String VIEW_ABOUT = "ABOUT";

    private DashboardPanel dashboardPanel;
    private TasksPanel tasksPanel;
    private AboutPanel aboutPanel;

    public MainWindow(TaskService taskService) {
        super("TaskFlow — Smart To-Do Manager (C++ + Java)");
        this.taskService = taskService;

        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1140, 740);
        setMinimumSize(new Dimension(940, 620));
        setLocationRelativeTo(null);
        getContentPane().setBackground(Theme.BG_DARK);

        cardLayout = new CardLayout();
        centerPanel = new JPanel(cardLayout);
        centerPanel.setBackground(Theme.BG_DARK);

        initViews();
        initUI();
    }

    private void initViews() {
        dashboardPanel = new DashboardPanel(taskService, this);
        tasksPanel = new TasksPanel(taskService, this);
        aboutPanel = new AboutPanel(taskService);

        centerPanel.add(dashboardPanel, VIEW_DASHBOARD);
        centerPanel.add(tasksPanel, VIEW_TASKS);
        centerPanel.add(aboutPanel, VIEW_ABOUT);
    }

    private void initUI() {
        setLayout(new BorderLayout());

        // --- Sidebar Navigation ---
        JPanel sidebar = new JPanel(new BorderLayout());
        sidebar.setBackground(Theme.SIDEBAR_DARK);
        sidebar.setPreferredSize(new Dimension(240, getHeight()));
        sidebar.setBorder(new CompoundBorder(
                new LineBorder(Theme.BORDER_COLOR, 1),
                new EmptyBorder(24, 16, 24, 16)
        ));

        // Brand Logo Area
        JPanel brandArea = new JPanel();
        brandArea.setOpaque(false);
        brandArea.setLayout(new BoxLayout(brandArea, BoxLayout.Y_AXIS));

        JLabel brandName = new JLabel("TaskFlow");
        brandName.setFont(Theme.FONT_HERO);
        brandName.setForeground(Theme.TEXT_PRIMARY);

        JLabel brandSub = new JLabel("C++17 + Java 17 Engine");
        brandSub.setFont(Theme.FONT_SMALL);
        brandSub.setForeground(Theme.ACCENT_AMBER);

        brandArea.add(brandName);
        brandArea.add(Box.createVerticalStrut(4));
        brandArea.add(brandSub);
        sidebar.add(brandArea, BorderLayout.NORTH);

        // Navigation links
        JPanel navMenu = new JPanel();
        navMenu.setOpaque(false);
        navMenu.setLayout(new BoxLayout(navMenu, BoxLayout.Y_AXIS));
        navMenu.setBorder(new EmptyBorder(32, 0, 0, 0));

        navMenu.add(createNavButton("Dashboard", VIEW_DASHBOARD));
        navMenu.add(Box.createVerticalStrut(8));
        navMenu.add(createNavButton("All Tasks", VIEW_TASKS));
        navMenu.add(Box.createVerticalStrut(8));
        navMenu.add(createNavButton("Viva & Architecture", VIEW_ABOUT));

        sidebar.add(navMenu, BorderLayout.CENTER);

        // Bottom quick action
        JPanel bottomAction = new JPanel(new BorderLayout());
        bottomAction.setOpaque(false);

        JButton quickAdd = Theme.createPrimaryButton("+ Add Task");
        quickAdd.addActionListener(e -> openAddTaskDialog());
        bottomAction.add(quickAdd, BorderLayout.CENTER);

        sidebar.add(bottomAction, BorderLayout.SOUTH);

        add(sidebar, BorderLayout.WEST);
        add(centerPanel, BorderLayout.CENTER);

        // Set initial active state
        updateNavSelection(VIEW_DASHBOARD);
    }

    private JButton createNavButton(String title, String viewName) {
        JButton btn = new JButton(title);
        btn.setFont(Theme.FONT_SUBHEADING);
        btn.setForeground(Theme.TEXT_SECONDARY);
        btn.setBackground(Theme.SIDEBAR_DARK);
        btn.setFocusPainted(false);
        btn.setHorizontalAlignment(SwingConstants.LEFT);
        btn.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setBorder(new EmptyBorder(10, 14, 10, 14));

        btn.addActionListener(e -> {
            cardLayout.show(centerPanel, viewName);
            updateNavSelection(viewName);
        });

        navButtons.put(viewName, btn);
        return btn;
    }

    private void updateNavSelection(String activeView) {
        for (Map.Entry<String, JButton> entry : navButtons.entrySet()) {
            JButton b = entry.getValue();
            if (entry.getKey().equals(activeView)) {
                b.setBackground(Theme.CARD_DARK);
                b.setForeground(Theme.ACCENT_AMBER);
                b.setBorder(new CompoundBorder(
                        new LineBorder(Theme.ACCENT_AMBER, 1, true),
                        new EmptyBorder(9, 13, 9, 13)
                ));
            } else {
                b.setBackground(Theme.SIDEBAR_DARK);
                b.setForeground(Theme.TEXT_SECONDARY);
                b.setBorder(new EmptyBorder(10, 14, 10, 14));
            }
        }
    }

    public void openAddTaskDialog() {
        TaskDialog dialog = new TaskDialog(this, taskService, null);
        dialog.setVisible(true);
    }

    public void openEditTaskDialog(Task task) {
        TaskDialog dialog = new TaskDialog(this, taskService, task);
        dialog.setVisible(true);
    }

    public void switchView(String viewName) {
        cardLayout.show(centerPanel, viewName);
        updateNavSelection(viewName);
    }
}
