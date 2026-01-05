package com.fyp.management.system.fyp_management_system.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.ToString;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "grades")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Grade {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Document document;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluator_id", nullable = false)
    @JsonIgnoreProperties("grades")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User evaluator;
    
    @Column(nullable = false)
    private String rubricCriteria;
    
    @Column(nullable = false)
    private Double score;
    
    @Column(nullable = false)
    private Double maxScore;
    
    @Column(length = 1000)
    private String feedback;
    
    @Column(nullable = false)
    private Boolean isReleased = false;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime gradedAt;
    
    private LocalDateTime releasedAt;
}

