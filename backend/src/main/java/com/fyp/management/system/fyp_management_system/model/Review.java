package com.fyp.management.system.fyp_management_system.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import lombok.ToString;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {
    
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
    @JoinColumn(name = "reviewer_id", nullable = false)
    @JsonIgnoreProperties("reviews")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User reviewer;
    
    @Column(nullable = false, length = 2000)
    private String comments;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReviewDecision decision;
    
    @Column(nullable = false)
    private Integer reviewRound = 1;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime reviewedAt;
    
    public enum ReviewDecision {
        APPROVED,
        REVISION_REQUESTED,
        REJECTED
    }
}

