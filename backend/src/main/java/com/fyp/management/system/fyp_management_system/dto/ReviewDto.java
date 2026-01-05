package com.fyp.management.system.fyp_management_system.dto;

import com.fyp.management.system.fyp_management_system.model.Review;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDto {
    private Long id;
    private Long documentId;
    private String documentTitle;
    private Long reviewerId;
    private String reviewerName;
    private String reviewerRole; // SUPERVISOR, EVALUATOR, FYP_COMMITTEE
    
    @NotBlank(message = "Comments are required")
    private String comments;
    
    @NotNull(message = "Decision is required")
    private Review.ReviewDecision decision;
    
    private Integer reviewRound;
    private LocalDateTime reviewedAt;
}

