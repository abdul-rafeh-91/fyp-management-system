package com.fyp.management.system.fyp_management_system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentVersionDto {
    private Long id;
    private Long documentId;
    private Integer versionNumber;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String changeDescription;
    private Boolean wasSubmitted;
    private LocalDateTime uploadedAt;
}

