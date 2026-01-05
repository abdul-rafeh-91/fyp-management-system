package com.fyp.management.system.fyp_management_system.service;

import com.fyp.management.system.fyp_management_system.model.Deadline;
import com.fyp.management.system.fyp_management_system.model.Document;
import com.fyp.management.system.fyp_management_system.model.Notification;
import com.fyp.management.system.fyp_management_system.model.User;
import com.fyp.management.system.fyp_management_system.repository.DeadlineRepository;
import com.fyp.management.system.fyp_management_system.repository.DocumentRepository;
import com.fyp.management.system.fyp_management_system.repository.DocumentVersionRepository;
import com.fyp.management.system.fyp_management_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeadlineService {
    
    private final DeadlineRepository deadlineRepository;
    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final FileStorageService fileStorageService;
    
    @Transactional
    public Deadline createOrUpdateDeadline(
            String deadlineType,
            Document.DocumentType documentType,
            LocalDateTime deadline,
            String description,
            Long userId) {
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getRole() != User.Role.FYP_COMMITTEE) {
            throw new RuntimeException("Only FYP Committee can set deadlines");
        }
        
        // Check if deadline already exists for this deadline type
        Deadline existingDeadline = deadlineRepository.findByDeadlineType(deadlineType)
                .orElse(null);
        
        Deadline savedDeadline;
        boolean isNewDeadline = existingDeadline == null;
        
        if (existingDeadline != null) {
            existingDeadline.setDeadline(deadline);
            existingDeadline.setDescription(description);
            existingDeadline.setDocumentType(documentType); // Update document type if changed
            existingDeadline.setSetBy(user);
            savedDeadline = deadlineRepository.save(existingDeadline);
        } else {
            Deadline newDeadline = Deadline.builder()
                    .deadlineType(deadlineType)
                    .documentType(documentType)
                    .deadline(deadline)
                    .description(description)
                    .isActive(true)
                    .setBy(user)
                    .build();
            savedDeadline = deadlineRepository.save(newDeadline);
        }
        
        // Notify all students (App + Email)
        List<User> students = userRepository.findByRole(User.Role.STUDENT);
        String action = isNewDeadline ? "added" : "updated";
        
        for (User student : students) {
            notificationService.createNotification(
                    student,
                    "Deadline " + (isNewDeadline ? "Added" : "Updated"),
                    "A deadline has been " + action + " for " + deadlineType,
                    Notification.NotificationType.DEADLINE_ADDED,
                    "Deadline",
                    savedDeadline.getId()
            );
            
            emailService.sendEmail(
                    student.getEmail(),
                    "Deadline " + (isNewDeadline ? "Added" : "Updated") + " - Track Sphere",
                    "Dear " + student.getFullName() + ",\n\n" +
                    "A deadline has been " + action + " for your Final Year Project.\n\n" +
                    "Deadline Type: " + deadlineType + "\n" +
                    "Deadline: " + deadline + "\n" +
                    "Description: " + (description != null ? description : "No description") + "\n\n" +
                    "Please log in to Track Sphere for more details.\n\n" +
                    "Best regards,\nTrack Sphere Team"
            );
        }
        
        return savedDeadline;
    }
    
    public Deadline getDeadlineByType(Document.DocumentType documentType) {
        return deadlineRepository.findByDocumentType(documentType)
                .orElseThrow(() -> new RuntimeException("Deadline not found for document type: " + documentType));
    }
    
    public Deadline getDeadlineByDeadlineType(String deadlineType) {
        return deadlineRepository.findByDeadlineType(deadlineType)
                .orElseThrow(() -> new RuntimeException("Deadline not found for deadline type: " + deadlineType));
    }
    
    public List<Deadline> getAllActiveDeadlines() {
        // Return all deadlines where isActive = true
        // This includes expired deadlines (where deadline date has passed)
        // Expired deadlines should still be shown to students with "Deadline Guzar Gayi Hai" message
        return deadlineRepository.findByIsActiveTrue();
    }
    
    public List<Deadline> getAllDeadlines() {
        try {
            List<Deadline> deadlines = deadlineRepository.findAll();
            return deadlines != null ? deadlines : new java.util.ArrayList<>();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error fetching deadlines: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void deactivateDeadline(Long deadlineId) {
        Deadline deadline = deadlineRepository.findById(deadlineId)
                .orElseThrow(() -> new RuntimeException("Deadline not found"));
        deadline.setIsActive(false);
        deadlineRepository.save(deadline);
    }
    
    @Transactional
    public void deleteDeadline(Long deadlineId) {
        Deadline deadline = deadlineRepository.findById(deadlineId)
                .orElseThrow(() -> new RuntimeException("Deadline not found"));
        
        String deadlineType = deadline.getDeadlineType();
        Document.DocumentType documentType = deadline.getDocumentType();
        
        // If deadline is linked to a document type, delete all documents of that type
        if (documentType != null) {
            List<Document> documents = documentRepository.findByType(documentType);
            for (Document document : documents) {
                try {
                    // Delete associated file from storage
                    if (document.getFilePath() != null && !document.getFilePath().isEmpty()) {
                        try {
                            fileStorageService.deleteFile(document.getFileName());
                        } catch (Exception e) {
                            // Log but continue - file might not exist
                            System.err.println("Failed to delete file: " + document.getFileName() + " - " + e.getMessage());
                        }
                    }
                    
                    // Delete document versions
                    if (document.getVersions() != null && !document.getVersions().isEmpty()) {
                        documentVersionRepository.deleteAll(document.getVersions());
                    }
                    
                    // Delete the document itself
                    documentRepository.delete(document);
                } catch (Exception e) {
                    // Log error but continue with other documents
                    System.err.println("Error deleting document " + document.getId() + ": " + e.getMessage());
                }
            }
        }
        
        // Notify all students about deadline deletion
        List<User> students = userRepository.findByRole(User.Role.STUDENT);
        for (User student : students) {
            notificationService.createNotification(
                    student,
                    "Deadline Deleted",
                    "The deadline for " + deadlineType + " has been deleted" + 
                    (documentType != null ? ". All related documents have been removed." : "."),
                    Notification.NotificationType.SYSTEM_ANNOUNCEMENT,
                    "Deadline",
                    null
            );
            
            emailService.sendEmail(
                    student.getEmail(),
                    "Deadline Deleted - Track Sphere",
                    "Dear " + student.getFullName() + ",\n\n" +
                    "The deadline for " + deadlineType + " has been deleted.\n\n" +
                    (documentType != null ? "All documents uploaded for this deadline type have been removed from the system.\n\n" : "") +
                    "Please contact your supervisor or FYP Committee for more information.\n\n" +
                    "Best regards,\nTrack Sphere Team"
            );
        }
        
        // Delete the deadline from database
        deadlineRepository.delete(deadline);
    }
    
    // This method can be called by a scheduled task to notify students about approaching deadlines
    public void notifyApproachingDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threeDaysFromNow = now.plusDays(3);
        
        List<Deadline> activeDeadlines = getAllActiveDeadlines();
        List<User> students = userRepository.findByRole(User.Role.STUDENT);
        
        for (Deadline deadline : activeDeadlines) {
            // Notify if deadline is within 3 days
            if (deadline.getDeadline().isAfter(now) && 
                deadline.getDeadline().isBefore(threeDaysFromNow)) {
                
                for (User student : students) {
                    // Check if student (or their group) has already submitted
                    boolean hasSubmitted = false;
                    
                    if (student.getProjectGroup() != null) {
                         // Check group documents
                         List<Document> groupDocs = documentRepository.findByProjectGroup(student.getProjectGroup());
                         hasSubmitted = groupDocs.stream()
                                 .anyMatch(d -> d.getType() == deadline.getDocumentType());
                    } else {
                         // Check individual documents
                         List<Document> studentDocs = documentRepository.findByStudent(student);
                         hasSubmitted = studentDocs.stream()
                                 .anyMatch(d -> d.getType() == deadline.getDocumentType());
                    }
                    
                    if (!hasSubmitted) {
                        notificationService.createNotification(
                                student,
                                "Deadline Approaching",
                                "Only 3 days left for " + deadline.getDocumentType() + " submission",
                                Notification.NotificationType.DEADLINE_APPROACHING,
                                "Deadline",
                                deadline.getId()
                        );
                        
                        emailService.sendEmail(
                                student.getEmail(),
                                "Deadline Approaching - Track Sphere",
                                "Dear " + student.getFullName() + ",\n\n" +
                                "This is a reminder that a deadline is approaching.\n\n" +
                                "Document Type: " + deadline.getDocumentType() + "\n" +
                                "Deadline: " + deadline.getDeadline() + "\n" +
                                "Days Remaining: 3\n\n" +
                                "Please make sure to submit your document on time.\n\n" +
                                "Best regards,\nTrack Sphere Team"
                        );
                    }
                }
            }
        }
    }
}

