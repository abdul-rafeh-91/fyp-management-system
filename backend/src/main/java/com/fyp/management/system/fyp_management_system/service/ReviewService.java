package com.fyp.management.system.fyp_management_system.service;

import com.fyp.management.system.fyp_management_system.dto.ReviewDto;
import com.fyp.management.system.fyp_management_system.model.Document;
import com.fyp.management.system.fyp_management_system.model.Notification;
import com.fyp.management.system.fyp_management_system.model.ProjectGroup;
import com.fyp.management.system.fyp_management_system.model.Review;
import com.fyp.management.system.fyp_management_system.model.User;
import com.fyp.management.system.fyp_management_system.repository.DocumentRepository;
import com.fyp.management.system.fyp_management_system.repository.ReviewRepository;
import com.fyp.management.system.fyp_management_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {
    
    private final ReviewRepository reviewRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    
    @Transactional
    public Review createReview(ReviewDto reviewDto, Long reviewerId) {
        Document document = documentRepository.findById(reviewDto.getDocumentId())
                .orElseThrow(() -> new RuntimeException("Document not found"));
        
        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("Reviewer not found"));
        
        // Validate reviewer role
        if (reviewer.getRole() != User.Role.SUPERVISOR && 
            reviewer.getRole() != User.Role.EVALUATOR &&
            reviewer.getRole() != User.Role.FYP_COMMITTEE) {
            throw new RuntimeException("Only supervisors, evaluators, and FYP committee can review documents");
        }
        
        Review review = Review.builder()
                .document(document)
                .reviewer(reviewer)
                .comments(reviewDto.getComments())
                .decision(reviewDto.getDecision())
                .reviewRound(reviewDto.getReviewRound() != null ? reviewDto.getReviewRound() : 1)
                .build();
        
        Review savedReview = reviewRepository.save(review);
        
        // Update document status based on review decision and send notifications
        updateDocumentStatusAfterReview(document, reviewDto.getDecision(), reviewer);
        
        return savedReview;
    }
    
    private void updateDocumentStatusAfterReview(Document document, Review.ReviewDecision decision, User reviewer) {
        User student = document.getStudent();
        User supervisor = document.getSupervisor();
        ProjectGroup group = document.getProjectGroup();
        
        // Helper method to notify student or group
        Runnable notifyStudentOrGroup = () -> {
            String title = "";
            String message = "";
            String emailSubject = "";
            String emailBody = "";
            Notification.NotificationType type = Notification.NotificationType.REVIEW_RECEIVED;
            
            // Generate content based on decision and reviewer logic (simplified for brevity in helper, but logic is context-dependent)
            // Actually, avoiding over-abstraction to keep switch-case clear.
            // Just iterating members where needed.
        };

        if (reviewer.getRole() == User.Role.SUPERVISOR) {
            switch (decision) {
                case APPROVED:
                    document.setStatus(Document.Status.SUPERVISOR_APPROVED);
                    document.setStatus(Document.Status.UNDER_EVALUATION_COMMITTEE_REVIEW);
                    
                    // Notify all evaluators (App + Email)
                    List<User> evaluators = userRepository.findByRole(User.Role.EVALUATOR);
                    for (User evaluator : evaluators) {
                        notificationService.createNotification(
                                evaluator,
                                "Document Ready for Evaluation",
                                (group != null ? group.getName() : student.getFullName()) + "'s " + document.getType() + " has been approved by supervisor",
                                Notification.NotificationType.DOCUMENT_SUBMITTED,
                                "Document",
                                document.getId()
                        );
                        // Email logic kept same or updated slightly
                        emailService.sendEmail(
                                evaluator.getEmail(),
                                "Document Ready for Evaluation - Track Sphere",
                                "Dear " + evaluator.getFullName() + ",\n\n" +
                                "A new document is ready for your evaluation.\n\n" +
                                "Student/Group: " + (group != null ? group.getName() : student.getFullName()) + "\n" +
                                "Document: " + document.getType() + "\n" +
                                "Title: " + document.getTitle() + "\n\n" +
                                "Please log in to Track Sphere to review and evaluate the document.\n\n" +
                                "Best regards,\nTrack Sphere Team"
                        );
                    }
                    break;
                    
                case REVISION_REQUESTED:
                    document.setStatus(Document.Status.SUPERVISOR_REVISION_REQUESTED);
                    notifyGroupOrStudent(group, student, 
                        "Revision Required", 
                        "Your supervisor has requested revisions on " + document.getType(),
                        "Revision Required - Track Sphere",
                        "Your supervisor has reviewed your " + document.getType() + " and requested revisions.\n\n" +
                        "Document: " + document.getTitle() + "\n" +
                        "Supervisor: " + (supervisor != null ? supervisor.getFullName() : "Supervisor") + "\n\n" +
                        "Please log in to Track Sphere to view the feedback and resubmit."
                    );
                    break;
                    
                case REJECTED:
                    document.setStatus(Document.Status.REJECTED);
                    notifyGroupOrStudent(group, student,
                        "Document Rejected",
                        "Your " + document.getType() + " has been rejected",
                        "Document Rejected - Track Sphere",
                        "Your " + document.getType() + " has been rejected.\n\n" +
                        "Please contact your supervisor for more information."
                    );
                    break;
            }
        } else if (reviewer.getRole() == User.Role.EVALUATOR) {
            switch (decision) {
                case APPROVED:
                    document.setStatus(Document.Status.EVALUATION_COMMITTEE_APPROVED);
                    break;
                    
                case REVISION_REQUESTED:
                    document.setStatus(Document.Status.EVALUATION_COMMITTEE_REVISION_REQUESTED);
                    document.setIsSubmitted(false); // Enable resubmission
                    documentRepository.save(document);
                    
                    notifyGroupOrStudent(group, student,
                        "Revision Required by Evaluation Committee",
                        "The evaluation committee has requested revisions on " + document.getType() + ". Please review the feedback and resubmit.",
                        "Revision Required - Track Sphere",
                        "The evaluation committee has reviewed your " + document.getType() + " and requested revisions.\n\n" +
                        "Document: " + document.getTitle() + "\n\n" +
                        "Please log in to Track Sphere to view the feedback and resubmit."
                    );
                    
                    // Notify supervisor
                    if (supervisor != null) {
                        notificationService.createNotification(
                                supervisor,
                                "Revision Required by Evaluation Committee",
                                "Evaluation committee requested revisions for " + (group != null ? group.getName() : student.getFullName()) + "'s " + document.getType(),
                                Notification.NotificationType.REVIEW_RECEIVED,
                                "Document",
                                document.getId()
                        );
                        emailService.sendEmail(
                                supervisor.getEmail(),
                                "Revision Required - Track Sphere",
                                "Dear " + supervisor.getFullName() + ",\n\n" +
                                "The evaluation committee has requested revisions for your student's document.\n\n" +
                                "Student/Group: " + (group != null ? group.getName() : student.getFullName()) + "\n" +
                                "Document: " + document.getTitle() + "\n\n" +
                                "Please guide your student accordingly.\n\n" +
                                "Best regards,\nTrack Sphere Team"
                        );
                    }
                    break;
                    
                case REJECTED:
                    document.setStatus(Document.Status.REJECTED);
                    notifyGroupOrStudent(group, student,
                        "Document Rejected",
                        "Your " + document.getType() + " has been rejected by evaluation committee",
                        "Document Rejected - Track Sphere",
                        "Your " + document.getType() + " has been rejected by the evaluation committee.\n\n" +
                        "Please contact your supervisor and the evaluation committee for more information."
                    );
                    break;
            }
        } else if (reviewer.getRole() == User.Role.FYP_COMMITTEE) {
            switch (decision) {
                case APPROVED:
                    document.setStatus(Document.Status.FYP_COMMITTEE_APPROVED);
                    document.setStatus(Document.Status.FINAL_APPROVED);
                    break;
                    
                case REVISION_REQUESTED:
                    document.setStatus(Document.Status.FYP_COMMITTEE_REVISION_REQUESTED);
                    notifyGroupOrStudent(group, student,
                        "Revision Required by FYP Committee",
                        "The FYP committee has requested revisions on " + document.getType(),
                        "Revision Required - Track Sphere",
                        "The FYP committee has requested revisions on " + document.getType() + "."
                    );
                    break;
                    
                case REJECTED:
                    document.setStatus(Document.Status.REJECTED);
                    notifyGroupOrStudent(group, student,
                        "Document Rejected",
                        "Your " + document.getType() + " has been rejected by FYP committee",
                        "Document Rejected - Track Sphere",
                        "Your " + document.getType() + " has been rejected by FYP committee."
                    );
                    break;
            }
        }
        
        documentRepository.save(document);
    }

    private void notifyGroupOrStudent(ProjectGroup group, User student, String title, String message, String emailSubject, String emailBody) {
        if (group != null && group.getMembers() != null) {
            for (User member : group.getMembers()) {
                sendNotificationAndEmail(member, title, message, emailSubject, emailBody);
            }
        } else if (student != null) {
            sendNotificationAndEmail(student, title, message, emailSubject, emailBody);
        }
    }

    private void sendNotificationAndEmail(User user, String title, String message, String emailSubject, String emailBody) {
        notificationService.createNotification(
                user,
                title,
                message,
                Notification.NotificationType.REVIEW_RECEIVED,
                "Document",
                null // ID not propagated here easily without context, but OK for now OR pass it
        );
        emailService.sendEmail(
                user.getEmail(),
                emailSubject,
                "Dear " + user.getFullName() + ",\n\n" +
                emailBody + "\n\n" +
                "Best regards,\nTrack Sphere Team"
        );
    }
    
    public Review getReviewById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));
    }
    
    public List<Review> getReviewsByDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        return reviewRepository.findByDocumentOrderByReviewedAtDesc(document);
    }
    
    public List<Review> getReviewsByReviewer(Long reviewerId) {
        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("Reviewer not found"));
        return reviewRepository.findByReviewer(reviewer);
    }
    
    public ReviewDto convertToDto(Review review) {
        return ReviewDto.builder()
                .id(review.getId())
                .documentId(review.getDocument().getId())
                .documentTitle(review.getDocument().getTitle())
                .reviewerId(review.getReviewer().getId())
                .reviewerName(review.getReviewer().getFullName())
                .reviewerRole(review.getReviewer().getRole().name())
                .comments(review.getComments())
                .decision(review.getDecision())
                .reviewRound(review.getReviewRound())
                .reviewedAt(review.getReviewedAt())
                .build();
    }
}

