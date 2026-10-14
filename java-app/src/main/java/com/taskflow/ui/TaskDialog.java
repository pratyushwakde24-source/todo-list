package com.taskflow.ui;

import com.taskflow.model.Category;
import com.taskflow.model.Priority;
import com.taskflow.model.Task;
import com.taskflow.service.TaskService;
import com.taskflow.service.ValidationException;

import javax.swing.*;
import javax.swing.border.CompoundBorder;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import java.awt.*;
import java.time.LocalDate;

public class TaskDialog extends JDialog {

    private final TaskService taskService;
    private final Task taskToEdit; // null if creating new task

    private JTextField titleField;
    private JTextArea descArea;
    private JComboBox<Category> categoryCombo;
    private JComboBox<Priority> priorityCombo;
    private JTextField dueDateField;
    private JCheckBox completedCheck;
    private JLabel errorLabel;

    public TaskDialog(Frame parent, TaskService taskService, Task taskToEdit) {
        super(parent, taskToEdit == null ? "Create New Task" : "Edit Task", true);
        this.taskService = taskService;
        this.taskToEdit = taskToEdit;

        setSize(480, 540);
        setLocationRelativeTo(parent);
        setResizable(false);
        getContentPane().setBackground(Theme.BG_DARK);

        initUI();
    }

    private void initUI() {
        JPanel container = new JPanel(new BorderLayout(0, 16));
        container.setOpaque(false);
        container.setBorder(new EmptyBorder(24, 24, 24, 24));

        // Form Fields
        JPanel form = new JPanel();
        form.setOpaque(false);
        form.setLayout(new BoxLayout(form, BoxLayout.Y_AXIS));

        // Error message label
        errorLabel = new JLabel(" ");
        errorLabel.setFont(Theme.FONT_SMALL);
        errorLabel.setForeground(Theme.STATUS_DANGER);
        errorLabel.setAlignmentX(Component.LEFT_ALIGNMENT);
        form.add(errorLabel);
        form.add(Box.createVerticalStrut(8));

        // Title Field
        form.add(createFieldLabel("Task Title *"));
        form.add(Box.createVerticalStrut(4));
        titleField = Theme.createTextField();
        titleField.setAlignmentX(Component.LEFT_ALIGNMENT);
        titleField.setMaximumSize(new Dimension(Integer.MAX_VALUE, 36));
        form.add(titleField);
        form.add(Box.createVerticalStrut(14));

        // Description Field
        form.add(createFieldLabel("Description (Optional)"));
        form.add(Box.createVerticalStrut(4));
        descArea = new JTextArea(4, 20);
        descArea.setFont(Theme.FONT_BODY);
        descArea.setBackground(Theme.CARD_DARK);
        descArea.setForeground(Theme.TEXT_PRIMARY);
        descArea.setCaretColor(Theme.ACCENT_AMBER);
        descArea.setLineWrap(true);
        descArea.setWrapStyleWord(true);
        JScrollPane descScroll = new JScrollPane(descArea);
        descScroll.setBorder(new LineBorder(Theme.BORDER_COLOR, 1));
        descScroll.setAlignmentX(Component.LEFT_ALIGNMENT);
        descScroll.setMaximumSize(new Dimension(Integer.MAX_VALUE, 80));
        form.add(descScroll);
        form.add(Box.createVerticalStrut(14));

        // Category & Priority Row
        JPanel catPriRow = new JPanel(new GridLayout(1, 2, 14, 0));
        catPriRow.setOpaque(false);
        catPriRow.setAlignmentX(Component.LEFT_ALIGNMENT);
        catPriRow.setMaximumSize(new Dimension(Integer.MAX_VALUE, 60));

        JPanel catCol = new JPanel();
        catCol.setOpaque(false);
        catCol.setLayout(new BoxLayout(catCol, BoxLayout.Y_AXIS));
        catCol.add(createFieldLabel("Category"));
        catCol.add(Box.createVerticalStrut(4));
        categoryCombo = new JComboBox<>(Category.values());
        styleComboBox(categoryCombo);
        catCol.add(categoryCombo);

        JPanel priCol = new JPanel();
        priCol.setOpaque(false);
        priCol.setLayout(new BoxLayout(priCol, BoxLayout.Y_AXIS));
        priCol.add(createFieldLabel("Priority"));
        priCol.add(Box.createVerticalStrut(4));
        priorityCombo = new JComboBox<>(Priority.values());
        priorityCombo.setSelectedItem(Priority.MEDIUM);
        styleComboBox(priorityCombo);
        priCol.add(priorityCombo);

        catPriRow.add(catCol);
        catPriRow.add(priCol);
        form.add(catPriRow);
        form.add(Box.createVerticalStrut(14));

        // Due Date Field
        form.add(createFieldLabel("Due Date (YYYY-MM-DD)"));
        form.add(Box.createVerticalStrut(4));
        dueDateField = Theme.createTextField();
        dueDateField.setText(LocalDate.now().plusDays(2).toString());
        dueDateField.setAlignmentX(Component.LEFT_ALIGNMENT);
        dueDateField.setMaximumSize(new Dimension(Integer.MAX_VALUE, 36));
        form.add(dueDateField);
        form.add(Box.createVerticalStrut(14));

        // Completed Checkbox
        completedCheck = new JCheckBox("Mark as completed");
        completedCheck.setFont(Theme.FONT_BODY);
        completedCheck.setForeground(Theme.TEXT_PRIMARY);
        completedCheck.setOpaque(false);
        completedCheck.setAlignmentX(Component.LEFT_ALIGNMENT);
        form.add(completedCheck);

        // Populate fields if editing
        if (taskToEdit != null) {
            titleField.setText(taskToEdit.getTitle());
            descArea.setText(taskToEdit.getDescription());
            categoryCombo.setSelectedItem(taskToEdit.getCategory());
            priorityCombo.setSelectedItem(taskToEdit.getPriority());
            dueDateField.setText(taskToEdit.getDueDate());
            completedCheck.setSelected(taskToEdit.isCompleted());
        }

        container.add(form, BorderLayout.CENTER);

        // Action Buttons Row
        JPanel buttonsRow = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        buttonsRow.setOpaque(false);

        JButton cancelBtn = Theme.createSecondaryButton("Cancel");
        cancelBtn.addActionListener(e -> dispose());

        JButton saveBtn = Theme.createPrimaryButton(taskToEdit == null ? "Create Task" : "Save Changes");
        saveBtn.addActionListener(e -> handleSave());

        buttonsRow.add(cancelBtn);
        buttonsRow.add(saveBtn);
        container.add(buttonsRow, BorderLayout.SOUTH);

        add(container);
    }

    private JLabel createFieldLabel(String text) {
        JLabel lbl = new JLabel(text);
        lbl.setFont(Theme.FONT_SUBHEADING);
        lbl.setForeground(Theme.TEXT_SECONDARY);
        lbl.setAlignmentX(Component.LEFT_ALIGNMENT);
        return lbl;
    }

    private <T> void styleComboBox(JComboBox<T> cb) {
        cb.setFont(Theme.FONT_BODY);
        cb.setBackground(Theme.CARD_DARK);
        cb.setForeground(Theme.TEXT_PRIMARY);
        cb.setBorder(new LineBorder(Theme.BORDER_COLOR, 1));
        cb.setMaximumSize(new Dimension(Integer.MAX_VALUE, 36));
    }

    private void handleSave() {
        String title = titleField.getText();
        String desc = descArea.getText();
        Category cat = (Category) categoryCombo.getSelectedItem();
        Priority pri = (Priority) priorityCombo.getSelectedItem();
        String dueDate = dueDateField.getText();
        boolean completed = completedCheck.isSelected();

        try {
            if (taskToEdit == null) {
                taskService.createTask(title, desc, cat, pri, dueDate);
            } else {
                taskService.updateTask(taskToEdit.getId(), title, desc, cat, pri, dueDate, completed);
            }
            dispose();
        } catch (ValidationException ve) {
            errorLabel.setText("• " + ve.getMessage());
        } catch (Exception ex) {
            errorLabel.setText("• Error: " + ex.getMessage());
        }
    }
}
