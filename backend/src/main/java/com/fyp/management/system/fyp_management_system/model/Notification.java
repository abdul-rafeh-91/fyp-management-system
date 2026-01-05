package com.fyp.management.system.fyp_management_system.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.ToString;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"notifications", "projectGroup", "documents"})
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false, length = 1000)
    private String message;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;
    
    @Column(nullable = false)
    private Boolean isRead = false;
    
    private String relatedEntityType; // e.g., "Document", "Review"
    
    private Long relatedEntityId;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime readAt;
    
    public enum NotificationType {
        DOCUMENT_SUBMITTED,
        REVIEW_RECEIVED,
        GRADE_RECEIVED,
        GRADE_ASSIGNED,
        DEADLINE_REMINDER,
        REVISION_REQUESTED,
        DOCUMENT_APPROVED,
        GRADE_RELEASED,
        DEADLINE_ADDED,
        DEADLINE_APPROACHING,
        SYSTEM_ANNOUNCEMENT
    }
}

