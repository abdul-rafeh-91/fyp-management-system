package com.fyp.management.system.fyp_management_system.dto;

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
public class GradeDto {
    private Long id;
    private Long documentId;
    private String documentTitle;
    private Long evaluatorId;
    private String evaluatorName;
    
    @NotBlank(message = "Rubric criteria is required")
    private String rubricCriteria;
    
    @NotNull(message = "Score is required")
    private Double score;
    
    @NotNull(message = "Max score is required")
    private Double maxScore;
    
    private String feedback;
    private Boolean isReleased;
    private LocalDateTime gradedAt;
    private LocalDateTime releasedAt;
}

