package com.fyp.management.system.fyp_management_system.dto;

import com.fyp.management.system.fyp_management_system.model.Document;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentDto {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentRegistrationNumber;
    private Long supervisorId;
    private String supervisorName;
    private Document.DocumentType type;
    private String title;
    private String description;
    private String fileName;
    private Long fileSize;
    private Integer version;
    private Document.Status status;
    private Boolean isSubmitted;
    private Boolean isLocked;
    private Boolean isLateSubmission;
    private LocalDateTime submittedAt;
    private LocalDateTime deadline;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

