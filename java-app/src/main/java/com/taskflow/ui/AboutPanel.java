package com.taskflow.ui;

import com.taskflow.integration.CppEngineClient;
import com.taskflow.service.TaskService;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;

public class AboutPanel extends JPanel {

    private final TaskService taskService;
    private final JLabel engineStatusLabel;
    private final JLabel enginePathLabel;
    private final JTextArea pingOutputArea;

    public AboutPanel(TaskService taskService) {
        this.taskService = taskService;

        setBackground(Theme.BG_DARK);
        setLayout(new BorderLayout(0, 20));
        setBorder(new EmptyBorder(24, 28, 24, 28));

        // Main vertical container
        JPanel content = new JPanel();
        content.setOpaque(false);
        content.setLayout(new BoxLayout(content, BoxLayout.Y_AXIS));

        // Title
        JLabel title = new JLabel("System Architecture & Viva Demonstration Hub");
        title.setFont(Theme.FONT_HERO);
        title.setForeground(Theme.TEXT_PRIMARY);
        content.add(title);
        content.add(Box.createVerticalStrut(16));

        // 1. Project Info Card
        JPanel infoCard = new JPanel();
        infoCard.setBackground(Theme.PANEL_DARK);
        infoCard.setBorder(Theme.createCardBorder());
        infoCard.setLayout(new BoxLayout(infoCard, BoxLayout.Y_AXIS));

        JLabel appName = new JLabel("TaskFlow — Smart To-Do Manager v1.0.0");
        appName.setFont(Theme.FONT_HEADING);
        appName.setForeground(Theme.ACCENT_AMBER);

        JLabel appDesc = new JLabel("<html>A desktop task management system uniting a high-performance C++17 algorithmic engine with a modular Java 17 Swing interface via ProcessBuilder standard-stream IPC. Persists tasks locally using an RFC 4180 compliant CSV storage engine.</html>");
        appDesc.setFont(Theme.FONT_BODY);
        appDesc.setForeground(Theme.TEXT_SECONDARY);

        infoCard.add(appName);
        infoCard.add(Box.createVerticalStrut(8));
        infoCard.add(appDesc);
        content.add(infoCard);
        content.add(Box.createVerticalStrut(16));

        // 2. C++ Engine Live Diagnostics Card
        JPanel engineCard = new JPanel();
        engineCard.setBackground(Theme.PANEL_DARK);
        engineCard.setBorder(Theme.createCardBorder());
        engineCard.setLayout(new BoxLayout(engineCard, BoxLayout.Y_AXIS));

        JLabel engineTitle = new JLabel("Live C++ Engine (IPC) Diagnostics");
        engineTitle.setFont(Theme.FONT_HEADING);
        engineTitle.setForeground(Theme.TEXT_PRIMARY);
        engineCard.add(engineTitle);
        engineCard.add(Box.createVerticalStrut(10));

        CppEngineClient client = taskService.getEngineClient();

        engineStatusLabel = new JLabel("Engine Status: " + client.getEngineVersionInfo());
        engineStatusLabel.setFont(Theme.FONT_BODY);
        engineStatusLabel.setForeground(client.isEngineAvailable() ? Theme.STATUS_SUCCESS : Theme.ACCENT_AMBER);
        engineCard.add(engineStatusLabel);
        engineCard.add(Box.createVerticalStrut(4));

        enginePathLabel = new JLabel("Executable Path: " + client.getExecutablePath());
        enginePathLabel.setFont(Theme.FONT_SMALL);
        enginePathLabel.setForeground(Theme.TEXT_MUTED);
        engineCard.add(enginePathLabel);
        engineCard.add(Box.createVerticalStrut(12));

        JPanel pingActionRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 0));
        pingActionRow.setOpaque(false);

        JButton pingBtn = Theme.createPrimaryButton("Run Live C++ Ping (JSON IPC)");
        pingBtn.addActionListener(e -> runPingDiagnostic());

        JButton reloadSampleBtn = Theme.createSecondaryButton("Restore Presentation Sample Data");
        reloadSampleBtn.addActionListener(e -> {
            taskService.loadSamplePresentationTasks();
            JOptionPane.showMessageDialog(this, "Sample tasks restored in data/tasks.csv!", "Data Restored", JOptionPane.INFORMATION_MESSAGE);
        });

        pingActionRow.add(pingBtn);
        pingActionRow.add(reloadSampleBtn);
        engineCard.add(pingActionRow);
        engineCard.add(Box.createVerticalStrut(10));

        pingOutputArea = new JTextArea(4, 30);
        pingOutputArea.setFont(Theme.FONT_MONO);
        pingOutputArea.setBackground(Theme.CARD_DARK);
        pingOutputArea.setForeground(Theme.ACCENT_AMBER);
        pingOutputArea.setEditable(false);
        pingOutputArea.setText("// Click 'Run Live C++ Ping' to test ProcessBuilder execution...");
        JScrollPane pingScroll = new JScrollPane(pingOutputArea);
        pingScroll.setMaximumSize(new Dimension(Integer.MAX_VALUE, 90));
        engineCard.add(pingScroll);

        content.add(engineCard);
        content.add(Box.createVerticalStrut(16));

        // 3. College Viva Quick-Reference Card
        JPanel vivaCard = new JPanel();
        vivaCard.setBackground(Theme.PANEL_DARK);
        vivaCard.setBorder(Theme.createCardBorder());
        vivaCard.setLayout(new BoxLayout(vivaCard, BoxLayout.Y_AXIS));

        JLabel vivaTitle = new JLabel("College Viva Key Talking Points");
        vivaTitle.setFont(Theme.FONT_HEADING);
        vivaTitle.setForeground(Theme.TEXT_PRIMARY);
        vivaCard.add(vivaTitle);
        vivaCard.add(Box.createVerticalStrut(8));

        String vivaText = "<html>"
                + "<b>1. Why both C++ and Java?</b><br>"
                + "C++ delivers deterministic algorithmic execution speed for priority sorting, date math, and array filtering. Java provides an object-oriented architecture and robust desktop graphical user interface (Swing).<br><br>"
                + "<b>2. How do they communicate?</b><br>"
                + "Java uses <code>java.lang.ProcessBuilder</code> to launch the C++ binary. Commands and task payloads are serialized as JSON and piped through <code>stdin</code>, while C++ returns computed results via <code>stdout</code>.<br><br>"
                + "<b>3. How is data persisted?</b><br>"
                + "Tasks are stored in <code>data/tasks.csv</code> following the RFC 4180 standard with safe quote escaping and atomic file moves to prevent file corruption."
                + "</html>";

        JLabel vivaContent = new JLabel(vivaText);
        vivaContent.setFont(Theme.FONT_BODY);
        vivaContent.setForeground(Theme.TEXT_SECONDARY);
        vivaCard.add(vivaContent);

        content.add(vivaCard);

        JScrollPane scroll = new JScrollPane(content);
        scroll.setOpaque(false);
        scroll.getViewport().setOpaque(false);
        scroll.setBorder(null);
        add(scroll, BorderLayout.CENTER);
    }

    private void runPingDiagnostic() {
        CppEngineClient client = taskService.getEngineClient();
        client.locateEngineExecutable(); // refresh check

        engineStatusLabel.setText("Engine Status: " + client.getEngineVersionInfo());
        engineStatusLabel.setForeground(client.isEngineAvailable() ? Theme.STATUS_SUCCESS : Theme.ACCENT_AMBER);
        enginePathLabel.setText("Executable Path: " + client.getExecutablePath());

        try {
            if (client.isEngineAvailable()) {
                long start = System.nanoTime();
                String resp = client.executeCommand("{\"action\":\"PING\"}");
                long elapsedMs = (System.nanoTime() - start) / 1_000_000;
                pingOutputArea.setText("[SUCCESS] IPC Response (" + elapsedMs + " ms):\n" + resp);
            } else {
                pingOutputArea.setText("[NOTICE] C++ executable not compiled yet.\nCompile with 'scripts/build.bat' or 'make' in project root.\nJava fallback algorithms are active and handling all tasks safely.");
            }
        } catch (Exception ex) {
            pingOutputArea.setText("[ERROR] ProcessBuilder failed: " + ex.getMessage());
        }
    }
}
