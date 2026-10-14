package com.taskflow.ui;

import com.taskflow.model.DashboardStats;
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

public class DashboardPanel extends JPanel implements TaskService.TaskChangeListener {

    private final TaskService taskService;
    private final MainWindow mainWindow;

    private JLabel totalLabel;
    private JLabel completedLabel;
    private JLabel pendingLabel;
    private JLabel overdueLabel;
    private JProgressBar progressBar;
    private JLabel progressPercentLabel;
    private JPanel highPriorityContainer;
    private JPanel upcomingDeadlinesContainer;

    public DashboardPanel(TaskService taskService, MainWindow mainWindow) {
        this.taskService = taskService;
        this.mainWindow = mainWindow;
        this.taskService.addChangeListener(this);

        setBackground(Theme.BG_DARK);
        setLayout(new BorderLayout(0, 20));
        setBorder(new EmptyBorder(24, 28, 24, 28));

        initUI();
        refreshData();
    }

    private void initUI() {
        // --- Top Welcome & Action Header ---
        JPanel headerPanel = new JPanel(new BorderLayout());
        headerPanel.setOpaque(false);

        JPanel titleBlock = new JPanel(new GridLayout(2, 1, 0, 4));
        titleBlock.setOpaque(false);

        JLabel welcomeTitle = new JLabel("Welcome back to TaskFlow");
        welcomeTitle.setFont(Theme.FONT_HERO);
        welcomeTitle.setForeground(Theme.TEXT_PRIMARY);

        JLabel subtitle = new JLabel("C++ Algorithmic Engine & Java Swing Task Management System");
        subtitle.setFont(Theme.FONT_BODY);
        subtitle.setForeground(Theme.TEXT_MUTED);

        titleBlock.add(welcomeTitle);
        titleBlock.add(subtitle);
        headerPanel.add(titleBlock, BorderLayout.WEST);

        JPanel actionGroup = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        actionGroup.setOpaque(false);

        JButton sampleDataBtn = Theme.createSecondaryButton("Load Presentation Demo Tasks");
        sampleDataBtn.addActionListener(e -> {
            taskService.loadSamplePresentationTasks();
            JOptionPane.showMessageDialog(this,
                    "Loaded realistic academic demonstration tasks into local storage (data/tasks.csv)!",
                    "Demo Data Loaded", JOptionPane.INFORMATION_MESSAGE);
        });

        JButton addTaskBtn = Theme.createPrimaryButton("+ Add New Task");
        addTaskBtn.addActionListener(e -> mainWindow.openAddTaskDialog());

        actionGroup.add(sampleDataBtn);
        actionGroup.add(addTaskBtn);
        headerPanel.add(actionGroup, BorderLayout.EAST);

        add(headerPanel, BorderLayout.NORTH);

        // --- Center Scrollable Content ---
        JPanel mainContent = new JPanel();
        mainContent.setOpaque(false);
        mainContent.setLayout(new BoxLayout(mainContent, BoxLayout.Y_AXIS));

        // 1. KPI Cards Row
        JPanel kpiRow = new JPanel(new GridLayout(1, 4, 16, 0));
        kpiRow.setOpaque(false);
        kpiRow.setMaximumSize(new Dimension(Integer.MAX_VALUE, 110));

        totalLabel = new JLabel("0");
        completedLabel = new JLabel("0");
        pendingLabel = new JLabel("0");
        overdueLabel = new JLabel("0");

        kpiRow.add(createKpiCard("TOTAL TASKS", totalLabel, Theme.TEXT_PRIMARY));
        kpiRow.add(createKpiCard("COMPLETED", completedLabel, Theme.STATUS_SUCCESS));
        kpiRow.add(createKpiCard("PENDING", pendingLabel, Theme.ACCENT_AMBER));
        kpiRow.add(createKpiCard("OVERDUE", overdueLabel, Theme.STATUS_DANGER));

        mainContent.add(kpiRow);
        mainContent.add(Box.createVerticalStrut(20));

        // 2. Progress Banner
        JPanel progressCard = new JPanel(new BorderLayout(12, 8));
        progressCard.setBackground(Theme.PANEL_DARK);
        progressCard.setBorder(Theme.createCardBorder());
        progressCard.setMaximumSize(new Dimension(Integer.MAX_VALUE, 80));

        JPanel progressTop = new JPanel(new BorderLayout());
        progressTop.setOpaque(false);

        JLabel progressTitle = new JLabel("Sprint Completion Velocity");
        progressTitle.setFont(Theme.FONT_SUBHEADING);
        progressTitle.setForeground(Theme.TEXT_PRIMARY);

        progressPercentLabel = new JLabel("0.0% Complete");
        progressPercentLabel.setFont(Theme.FONT_SUBHEADING);
        progressPercentLabel.setForeground(Theme.ACCENT_AMBER);

        progressTop.add(progressTitle, BorderLayout.WEST);
        progressTop.add(progressPercentLabel, BorderLayout.EAST);
        progressCard.add(progressTop, BorderLayout.NORTH);

        progressBar = new JProgressBar(0, 100);
        progressBar.setValue(0);
        progressBar.setStringPainted(false);
        progressBar.setForeground(Theme.ACCENT_AMBER);
        progressBar.setBackground(Theme.CARD_DARK);
        progressBar.setBorder(new LineBorder(Theme.BORDER_COLOR, 1, true));
        progressBar.setPreferredSize(new Dimension(100, 10));

        progressCard.add(progressBar, BorderLayout.CENTER);
        mainContent.add(progressCard);
        mainContent.add(Box.createVerticalStrut(20));

        // 3. Two-Column Split: High Priority & Upcoming Deadlines
        JPanel splitRow = new JPanel(new GridLayout(1, 2, 20, 0));
        splitRow.setOpaque(false);

        // High-Priority Column
        JPanel highPriorityCard = new JPanel(new BorderLayout(0, 12));
        highPriorityCard.setBackground(Theme.PANEL_DARK);
        highPriorityCard.setBorder(Theme.createCardBorder());

        JLabel hpTitle = new JLabel("High-Priority Tasks (Calculated by C++)");
        hpTitle.setFont(Theme.FONT_SUBHEADING);
        hpTitle.setForeground(Theme.TEXT_PRIMARY);
        highPriorityCard.add(hpTitle, BorderLayout.NORTH);

        highPriorityContainer = new JPanel();
        highPriorityContainer.setOpaque(false);
        highPriorityContainer.setLayout(new BoxLayout(highPriorityContainer, BoxLayout.Y_AXIS));

        JScrollPane hpScroll = new JScrollPane(highPriorityContainer);
        hpScroll.setOpaque(false);
        hpScroll.getViewport().setOpaque(false);
        hpScroll.setBorder(null);
        highPriorityCard.add(hpScroll, BorderLayout.CENTER);

        // Upcoming Deadlines Column
        JPanel deadlinesCard = new JPanel(new BorderLayout(0, 12));
        deadlinesCard.setBackground(Theme.PANEL_DARK);
        deadlinesCard.setBorder(Theme.createCardBorder());

        JLabel dlTitle = new JLabel("Upcoming Deadlines");
        dlTitle.setFont(Theme.FONT_SUBHEADING);
        dlTitle.setForeground(Theme.TEXT_PRIMARY);
        deadlinesCard.add(dlTitle, BorderLayout.NORTH);

        upcomingDeadlinesContainer = new JPanel();
        upcomingDeadlinesContainer.setOpaque(false);
        upcomingDeadlinesContainer.setLayout(new BoxLayout(upcomingDeadlinesContainer, BoxLayout.Y_AXIS));

        JScrollPane dlScroll = new JScrollPane(upcomingDeadlinesContainer);
        dlScroll.setOpaque(false);
        dlScroll.getViewport().setOpaque(false);
        dlScroll.setBorder(null);
        deadlinesCard.add(dlScroll, BorderLayout.CENTER);

        splitRow.add(highPriorityCard);
        splitRow.add(deadlinesCard);

        mainContent.add(splitRow);

        JScrollPane mainScroll = new JScrollPane(mainContent);
        mainScroll.setOpaque(false);
        mainScroll.getViewport().setOpaque(false);
        mainScroll.setBorder(null);
        mainScroll.getVerticalScrollBar().setUnitIncrement(14);

        add(mainScroll, BorderLayout.CENTER);
    }

    private JPanel createKpiCard(String title, JLabel valueLabel, Color accentColor) {
        JPanel card = new JPanel(new BorderLayout(0, 6));
        card.setBackground(Theme.PANEL_DARK);
        card.setBorder(Theme.createCardBorder());

        JLabel titleLbl = new JLabel(title);
        titleLbl.setFont(Theme.FONT_SMALL);
        titleLbl.setForeground(Theme.TEXT_MUTED);

        valueLabel.setFont(Theme.FONT_STAT_NUMBER);
        valueLabel.setForeground(accentColor);

        card.add(titleLbl, BorderLayout.NORTH);
        card.add(valueLabel, BorderLayout.CENTER);
        return card;
    }

    public void refreshData() {
        DashboardStats stats = taskService.getDashboardStats();

        totalLabel.setText(String.valueOf(stats.getTotalTasks()));
        completedLabel.setText(String.valueOf(stats.getCompletedTasks()));
        pendingLabel.setText(String.valueOf(stats.getPendingTasks()));
        overdueLabel.setText(String.valueOf(stats.getOverdueTasks()));

        int pct = (int) Math.round(stats.getCompletionPercentage());
        progressBar.setValue(pct);
        progressPercentLabel.setText(String.format("%.1f%% Complete", stats.getCompletionPercentage()));

        // Populate High-Priority Tasks
        highPriorityContainer.removeAll();
        List<Task> highPriorityList = taskService.getHighPriorityPendingTasks(5);
        if (highPriorityList.isEmpty()) {
            JLabel empty = new JLabel("No pending high-priority tasks.");
            empty.setFont(Theme.FONT_BODY);
            empty.setForeground(Theme.TEXT_MUTED);
            highPriorityContainer.add(empty);
        } else {
            for (Task t : highPriorityList) {
                highPriorityContainer.add(createTaskListItem(t));
                highPriorityContainer.add(Box.createVerticalStrut(8));
            }
        }

        // Populate Upcoming Deadlines
        upcomingDeadlinesContainer.removeAll();
        List<Task> upcoming = taskService.getUpcomingDeadlines(5);
        if (upcoming.isEmpty()) {
            JLabel empty = new JLabel("No scheduled deadlines found.");
            empty.setFont(Theme.FONT_BODY);
            empty.setForeground(Theme.TEXT_MUTED);
            upcomingDeadlinesContainer.add(empty);
        } else {
            for (Task t : upcoming) {
                upcomingDeadlinesContainer.add(createTaskListItem(t));
                upcomingDeadlinesContainer.add(Box.createVerticalStrut(8));
            }
        }

        highPriorityContainer.revalidate();
        highPriorityContainer.repaint();
        upcomingDeadlinesContainer.revalidate();
        upcomingDeadlinesContainer.repaint();
    }

    private JPanel createTaskListItem(Task t) {
        JPanel item = new JPanel(new BorderLayout(10, 0));
        item.setBackground(Theme.CARD_DARK);
        item.setBorder(new CompoundBorder(
                new LineBorder(Theme.BORDER_COLOR, 1, true),
                new EmptyBorder(8, 12, 8, 12)
        ));
        item.setMaximumSize(new Dimension(Integer.MAX_VALUE, 46));

        JCheckBox check = new JCheckBox();
        check.setSelected(t.isCompleted());
        check.setOpaque(false);
        check.addActionListener(e -> taskService.toggleTaskCompletion(t.getId()));

        JLabel title = new JLabel(t.getTitle());
        title.setFont(Theme.FONT_BODY);
        title.setForeground(Theme.TEXT_PRIMARY);

        JPanel right = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        right.setOpaque(false);

        String dateStr = (t.getDueDate() != null && !t.getDueDate().isEmpty()) ? t.getDueDate() : "No Date";
        JLabel dateLabel = new JLabel(dateStr);
        dateLabel.setFont(Theme.FONT_SMALL);

        String today = LocalDate.now().toString();
        if (t.isOverdue(today)) {
            dateLabel.setForeground(Theme.STATUS_DANGER);
            dateLabel.setText("Overdue (" + dateStr + ")");
        } else {
            dateLabel.setForeground(Theme.TEXT_MUTED);
        }

        right.add(dateLabel);

        item.add(check, BorderLayout.WEST);
        item.add(title, BorderLayout.CENTER);
        item.add(right, BorderLayout.EAST);
        return item;
    }

    @Override
    public void onTasksChanged() {
        SwingUtilities.invokeLater(this::refreshData);
    }
}
