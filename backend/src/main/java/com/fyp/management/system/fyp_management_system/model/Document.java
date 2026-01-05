package com.fyp.management.system.fyp_management_system.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties("documents")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User student; // Uploader
    
    @ManyToOne
    @JoinColumn(name = "project_group_id")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ProjectGroup projectGroup; // The group this document belongs to

    @ManyToOne
    @JoinColumn(name = "supervisor_id")
    @JsonIgnoreProperties("supervisedStudents")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User supervisor;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private DocumentType type; // Nullable for custom deadline types
    
    @Column(length = 255)
    private String customType; // For custom deadline types (e.g., "Testing", "Code Files", etc.)
    
    @Column(nullable = false)
    private String title;
    
    @Column(length = 1000)
    private String description;
    
    @Column(nullable = false)
    private String fileName;
    
    @Column(nullable = false)
    private String filePath;
    
    private Long fileSize;
    
    @Column(nullable = false)
    private Integer version = 1;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Status status = Status.DRAFT;
    
    @Column(nullable = false)
    private Boolean isSubmitted = false;
    
    @Column(nullable = false)
    private Boolean isLocked = false;
    
    private LocalDateTime submittedAt;
    
    private LocalDateTime deadline;
    
    @Column(nullable = false)
    private Boolean isLateSubmission = false;
    
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Review> reviews = new ArrayList<>();
    
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Grade> grades = new ArrayList<>();
    
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<DocumentVersion> versions = new ArrayList<>();
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    public enum DocumentType {
        PROPOSAL,
        DESIGN_DOCUMENT,
        TEST_DOCUMENT,
        THESIS
    }
    
    public enum Status {
        DRAFT,
        SUBMITTED,
        UNDER_SUPERVISOR_REVIEW,
        SUPERVISOR_APPROVED,
        SUPERVISOR_REVISION_REQUESTED,
        UNDER_EVALUATION_COMMITTEE_REVIEW,
        EVALUATION_COMMITTEE_APPROVED,
        EVALUATION_COMMITTEE_REVISION_REQUESTED,
        UNDER_FYP_COMMITTEE_REVIEW,
        FYP_COMMITTEE_APPROVED,
        FYP_COMMITTEE_REVISION_REQUESTED,
        FINAL_APPROVED,
        REJECTED
    }
}

