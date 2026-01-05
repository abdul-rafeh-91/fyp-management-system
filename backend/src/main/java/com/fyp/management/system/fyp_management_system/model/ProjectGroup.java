package com.fyp.management.system.fyp_management_system.model;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "project_groups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // One group has one Supervisor
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supervisor_id")
    @JsonIgnoreProperties("supervisedStudents")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User supervisor;

    // One group has multiple Students
    @OneToMany(mappedBy = "projectGroup", fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"projectGroup", "supervisor", "password", "documents"})
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<User> members = new ArrayList<>();

    // One group has multiple Documents (shared ownership)
    @OneToMany(mappedBy = "projectGroup", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("projectGroup")
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Document> documents = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
