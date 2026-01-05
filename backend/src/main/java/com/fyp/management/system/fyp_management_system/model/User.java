package com.fyp.management.system.fyp_management_system.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    @JsonIgnore
    private String password;
    
    @Column(nullable = false)
    private String fullName;
    
    @Column(unique = true)
    private String registrationNumber; // For students
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    private String phoneNumber;
    
    private String department;
    
    private String university;
    
    @Column(columnDefinition = "MEDIUMTEXT")
    private String avatarUrl;
    
    @Column(nullable = false)
    @Builder.Default
    private String theme = "light"; // light or dark
    
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Document> documents = new ArrayList<>();
    
    @OneToMany(mappedBy = "supervisor", cascade = CascadeType.ALL)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Document> supervisedDocuments = new ArrayList<>();
    
    @OneToMany(mappedBy = "reviewer", cascade = CascadeType.ALL)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Review> reviews = new ArrayList<>();
    
    @OneToMany(mappedBy = "evaluator", cascade = CascadeType.ALL)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Grade> grades = new ArrayList<>();
    
    // For students: assigned project group
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_group_id")
    @JsonIgnoreProperties({"members", "documents", "supervisor"})
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ProjectGroup projectGroup;

    // For students: assigned supervisor (one supervisor can have multiple students)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User supervisor;
    
    // For supervisors: list of assigned students
    @OneToMany(mappedBy = "supervisor")
    @Builder.Default
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<User> supervisedStudents = new ArrayList<>();
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    public enum Role {
        STUDENT,
        SUPERVISOR,
        EVALUATOR,
        FYP_COMMITTEE
    }
}

