package com.fyp.management.system.fyp_management_system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    public void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            // Use the configured username as from address
            message.setFrom("tracksphere.fyp@gmail.com");
            
            mailSender.send(message);
        } catch (Exception e) {
            // Log error but don't throw - allow system to continue without email
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
            e.printStackTrace();
            // Don't throw exception - email failure shouldn't break the application
        }
    }
    
    public void sendNotificationEmail(String to, String title, String message) {
        String emailBody = String.format(
                "Dear User,\n\n%s\n\n%s\n\nBest regards,\nFYP Management System",
                title, message
        );
        sendEmail(to, title, emailBody);
    }
    
    public void sendDeadlineReminder(String to, String documentType, String deadline) {
        String subject = "Deadline Reminder: " + documentType;
        String body = String.format(
                "Dear Student,\n\nThis is a reminder that the deadline for your %s is %s.\n\n" +
                "Please ensure you submit your document before the deadline.\n\n" +
                "Best regards,\nFYP Management System",
                documentType, deadline
        );
        sendEmail(to, subject, body);
    }
    
    public void sendWelcomeEmail(String to, String fullName, String role) {
        String subject = "Welcome to FYP Management System";
        String body = String.format(
                "Dear %s,\n\nWelcome to the FYP Management System!\n\n" +
                "Your account has been created with the role: %s.\n\n" +
                "You can now log in and start using the system.\n\n" +
                "Best regards,\nFYP Management System",
                fullName, role
        );
        sendEmail(to, subject, body);
    }
}

