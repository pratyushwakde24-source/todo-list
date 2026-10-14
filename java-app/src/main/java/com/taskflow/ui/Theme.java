package com.taskflow.ui;

import javax.swing.*;
import javax.swing.border.Border;
import javax.swing.border.CompoundBorder;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import java.awt.*;

public final class Theme {
    private Theme() {}

    // Dark Charcoal & Warm Amber Palette
    public static final Color BG_DARK = new Color(18, 20, 26);
    public static final Color SIDEBAR_DARK = new Color(22, 25, 33);
    public static final Color PANEL_DARK = new Color(26, 29, 36);
    public static final Color CARD_DARK = new Color(34, 38, 48);
    public static final Color CARD_HOVER = new Color(42, 47, 59);
    public static final Color BORDER_COLOR = new Color(46, 52, 68);
    
    public static final Color ACCENT_AMBER = new Color(245, 158, 11);
    public static final Color ACCENT_ORANGE = new Color(234, 88, 12);
    public static final Color ACCENT_HOVER = new Color(217, 119, 6);
    
    public static final Color TEXT_PRIMARY = new Color(241, 245, 249);
    public static final Color TEXT_SECONDARY = new Color(203, 213, 225);
    public static final Color TEXT_MUTED = new Color(148, 163, 184);

    public static final Color STATUS_SUCCESS = new Color(34, 197, 94);
    public static final Color STATUS_WARNING = new Color(245, 158, 11);
    public static final Color STATUS_DANGER = new Color(239, 68, 68);
    public static final Color STATUS_INFO = new Color(59, 130, 246);

    // Fonts
    public static final Font FONT_HERO = new Font("Segoe UI", Font.BOLD, 22);
    public static final Font FONT_HEADING = new Font("Segoe UI", Font.BOLD, 16);
    public static final Font FONT_SUBHEADING = new Font("Segoe UI", Font.BOLD, 14);
    public static final Font FONT_BODY = new Font("Segoe UI", Font.PLAIN, 13);
    public static final Font FONT_SMALL = new Font("Segoe UI", Font.PLAIN, 12);
    public static final Font FONT_MONO = new Font("Consolas", Font.PLAIN, 13);
    public static final Font FONT_STAT_NUMBER = new Font("Segoe UI", Font.BOLD, 28);

    public static Border createCardBorder() {
        return new CompoundBorder(
                new LineBorder(BORDER_COLOR, 1, true),
                new EmptyBorder(16, 16, 16, 16)
        );
    }

    public static Border createInnerPadding(int top, int left, int bottom, int right) {
        return new EmptyBorder(top, left, bottom, right);
    }

    public static JButton createPrimaryButton(String text) {
        JButton btn = new JButton(text);
        btn.setFont(FONT_SUBHEADING);
        btn.setForeground(Color.WHITE);
        btn.setBackground(ACCENT_ORANGE);
        btn.setFocusPainted(false);
        btn.setBorder(new CompoundBorder(
                new LineBorder(ACCENT_AMBER, 1, true),
                new EmptyBorder(8, 16, 8, 16)
        ));
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));

        btn.addMouseListener(new java.awt.event.MouseAdapter() {
            @Override
            public void mouseEntered(java.awt.event.MouseEvent evt) {
                btn.setBackground(ACCENT_HOVER);
            }
            @Override
            public void mouseExited(java.awt.event.MouseEvent evt) {
                btn.setBackground(ACCENT_ORANGE);
            }
        });
        return btn;
    }

    public static JButton createSecondaryButton(String text) {
        JButton btn = new JButton(text);
        btn.setFont(FONT_BODY);
        btn.setForeground(TEXT_PRIMARY);
        btn.setBackground(CARD_DARK);
        btn.setFocusPainted(false);
        btn.setBorder(new CompoundBorder(
                new LineBorder(BORDER_COLOR, 1, true),
                new EmptyBorder(6, 12, 6, 12)
        ));
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));

        btn.addMouseListener(new java.awt.event.MouseAdapter() {
            @Override
            public void mouseEntered(java.awt.event.MouseEvent evt) {
                btn.setBackground(CARD_HOVER);
            }
            @Override
            public void mouseExited(java.awt.event.MouseEvent evt) {
                btn.setBackground(CARD_DARK);
            }
        });
        return btn;
    }

    public static JTextField createTextField() {
        JTextField tf = new JTextField();
        tf.setFont(FONT_BODY);
        tf.setBackground(CARD_DARK);
        tf.setForeground(TEXT_PRIMARY);
        tf.setCaretColor(ACCENT_AMBER);
        tf.setBorder(new CompoundBorder(
                new LineBorder(BORDER_COLOR, 1),
                new EmptyBorder(6, 10, 6, 10)
        ));
        return tf;
    }
}
