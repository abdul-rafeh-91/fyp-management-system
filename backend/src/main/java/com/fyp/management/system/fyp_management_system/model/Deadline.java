package com.fyp.management.system.fyp_management_system.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "deadlines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deadline {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100, unique = true)
    private String deadlineType; // Custom deadline type (e.g., "PROPOSAL", "Code Files", "Presentation", etc.)
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = true, columnDefinition = "VARCHAR(255) NULL")
    private Document.DocumentType documentType; // Optional: for backward compatibility with existing documents
    
    @Column(nullable = false)
    private LocalDateTime deadline;
    
    @Column(length = 500)
    private String description;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "set_by_user_id")
    @JsonIgnore
    private User setBy;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

