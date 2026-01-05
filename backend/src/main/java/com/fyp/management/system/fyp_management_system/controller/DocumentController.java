package com.fyp.management.system.fyp_management_system.controller;

import com.fyp.management.system.fyp_management_system.dto.DocumentDto;
import com.fyp.management.system.fyp_management_system.dto.DocumentVersionDto;
import com.fyp.management.system.fyp_management_system.model.Document;
import com.fyp.management.system.fyp_management_system.model.DocumentVersion;
import com.fyp.management.system.fyp_management_system.service.DocumentService;
import com.fyp.management.system.fyp_management_system.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class DocumentController {
    
    private final DocumentService documentService;
    private final FileStorageService fileStorageService;
    
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<?> createDocument(
            @RequestParam Long studentId,
            @RequestParam String type,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "File cannot be empty");
                return ResponseEntity.badRequest().body(error);
            }
            
            Document.DocumentType documentType = null;
            String customType = null;
            
            // Try to parse as enum first
            try {
                documentType = Document.DocumentType.valueOf(type);
            } catch (IllegalArgumentException e) {
                // If not a valid enum, treat it as custom type
                customType = type;
            }
            
            Document document = documentService.createDocument(studentId, documentType, customType, title, description, file);
            DocumentDto dto = documentService.convertToDto(document);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @PostMapping("/{id}/upload-version")
    public ResponseEntity<?> uploadNewVersion(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String changeDescription) {
        try {
            Document document = documentService.uploadNewVersion(id, file, changeDescription);
            DocumentDto dto = documentService.convertToDto(document);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<?> submitDocument(@PathVariable Long id) {
        try {
            Document document = documentService.submitDocument(id);
            DocumentDto dto = documentService.convertToDto(document);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PatchMapping("/{id}/assign-supervisor")
    @PreAuthorize("hasAuthority('ROLE_FYP_COMMITTEE')")
    public ResponseEntity<?> assignSupervisor(
            @PathVariable Long id,
            @RequestParam Long supervisorId) {
        try {
            Document document = documentService.assignSupervisor(id, supervisorId);
            DocumentDto dto = documentService.convertToDto(document);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'FYP_COMMITTEE')")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            Document.Status documentStatus = Document.Status.valueOf(status);
            Document document = documentService.updateDocumentStatus(id, documentStatus);
            DocumentDto dto = documentService.convertToDto(document);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(@PathVariable Long id) {
        try {
            Document document = documentService.getDocumentById(id);
            DocumentDto dto = documentService.convertToDto(document);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<DocumentDto>> getDocumentsByStudent(@PathVariable Long studentId) {
        List<Document> documents = documentService.getDocumentsByStudent(studentId);
        List<DocumentDto> dtos = documents.stream()
                .map(documentService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/supervisor/{supervisorId}")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'FYP_COMMITTEE')")
    public ResponseEntity<List<DocumentDto>> getDocumentsBySupervisor(@PathVariable Long supervisorId) {
        List<Document> documents = documentService.getDocumentsBySupervisor(supervisorId);
        List<DocumentDto> dtos = documents.stream()
                .map(documentService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/submitted")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'FYP_COMMITTEE', 'EVALUATOR')")
    public ResponseEntity<List<DocumentDto>> getAllSubmittedDocuments() {
        List<Document> documents = documentService.getAllSubmittedDocuments();
        List<DocumentDto> dtos = documents.stream()
                .map(documentService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'FYP_COMMITTEE', 'EVALUATOR')")
    public ResponseEntity<List<DocumentDto>> getDocumentsByStatus(@PathVariable String status) {
        try {
            Document.Status documentStatus = Document.Status.valueOf(status);
            List<Document> documents = documentService.getDocumentsByStatus(documentStatus);
            List<DocumentDto> dtos = documents.stream()
                    .map(documentService::convertToDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{id}/versions")
    public ResponseEntity<List<DocumentVersionDto>> getDocumentVersions(@PathVariable Long id) {
        List<DocumentVersion> versions = documentService.getDocumentVersions(id);
        List<DocumentVersionDto> dtos = versions.stream()
                .map(documentService::convertToVersionDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        try {
            Document document = documentService.getDocumentById(id);
            Resource resource = fileStorageService.loadFileAsResource(document.getFilePath());
            
            // Determine content type based on file extension
            String contentType = determineContentType(document.getFileName());
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + document.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{id}/view")
    public ResponseEntity<Resource> viewDocument(@PathVariable Long id) {
        try {
            Document document = documentService.getDocumentById(id);
            Resource resource = fileStorageService.loadFileAsResource(document.getFilePath());
            
            // Determine content type based on file extension
            String contentType = determineContentType(document.getFileName());
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "inline; filename=\"" + document.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }
    
    private String determineContentType(String fileName) {
        if (fileName == null) {
            return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
        
        String lowerFileName = fileName.toLowerCase();
        if (lowerFileName.endsWith(".pdf")) {
            return "application/pdf";
        } else if (lowerFileName.endsWith(".doc") || lowerFileName.endsWith(".docx")) {
            return "application/msword";
        } else if (lowerFileName.endsWith(".ppt") || lowerFileName.endsWith(".pptx")) {
            return "application/vnd.ms-powerpoint";
        } else if (lowerFileName.endsWith(".xls") || lowerFileName.endsWith(".xlsx")) {
            return "application/vnd.ms-excel";
        } else if (lowerFileName.endsWith(".txt")) {
            return "text/plain";
        } else if (lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowerFileName.endsWith(".png")) {
            return "image/png";
        } else {
            return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
    }
}

