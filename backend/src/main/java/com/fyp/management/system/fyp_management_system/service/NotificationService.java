package com.fyp.management.system.fyp_management_system.service;

import com.fyp.management.system.fyp_management_system.model.Notification;
import com.fyp.management.system.fyp_management_system.model.User;
import com.fyp.management.system.fyp_management_system.repository.NotificationRepository;
import com.fyp.management.system.fyp_management_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    @Transactional
    public Notification createNotification(
            User user,
            String title,
            String message,
            Notification.NotificationType type,
            String relatedEntityType,
            Long relatedEntityId) {
        
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .build();
        
        Notification saved = notificationRepository.save(notification);
        
        // Send email notification
        try {
            emailService.sendNotificationEmail(user.getEmail(), title, message);
        } catch (Exception e) {
            // Log error but don't fail the notification creation
            System.err.println("Failed to send email notification: " + e.getMessage());
        }
        
        return saved;
    }
    
    @Transactional
    public void createNotificationForMultipleUsers(
            List<User> users,
            String title,
            String message,
            Notification.NotificationType type) {
        
        for (User user : users) {
            createNotification(user, title, message, type, null, null);
        }
    }
    
    @Transactional
    public Notification markAsRead(Long notificationId) {
        Notification notification = getNotificationById(notificationId);
        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }
    
    @Transactional
    public void markAllAsReadForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Notification> unreadNotifications = notificationRepository.findByUserAndIsReadFalse(user);
        LocalDateTime now = LocalDateTime.now();
        
        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
            notification.setReadAt(now);
            notificationRepository.save(notification);
        }
    }
    
    public Notification getNotificationById(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
    }
    
    public List<Notification> getNotificationsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }
    
    public List<Notification> getUnreadNotificationsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByUserAndIsReadFalse(user);
    }
    
    public Long getUnreadCountForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.countByUserAndIsReadFalse(user);
    }
    
    @Transactional
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }
}

