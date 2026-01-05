package com.fyp.management.system.fyp_management_system.controller;

import com.fyp.management.system.fyp_management_system.model.Deadline;
import com.fyp.management.system.fyp_management_system.model.Document;
import com.fyp.management.system.fyp_management_system.service.DeadlineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/deadlines")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class DeadlineController {
    
    private final DeadlineService deadlineService;
    
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_FYP_COMMITTEE')")
    public ResponseEntity<?> createOrUpdateDeadline(
            @RequestParam String deadlineType,
            @RequestParam String deadline,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String documentType, // Optional: for backward compatibility
            @RequestParam Long userId) {
        try {
            // Parse LocalDateTime with multiple format support
            LocalDateTime deadlineDate;
            try {
                // Try ISO format first: "2026-01-02T09:40:00"
                deadlineDate = LocalDateTime.parse(deadline, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (DateTimeParseException e1) {
                try {
                    // Try format without seconds: "2026-01-02T09:40"
                    deadlineDate = LocalDateTime.parse(deadline, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));
                } catch (DateTimeParseException e2) {
                    // Try format with space: "2026-01-02 09:40:00"
                    deadlineDate = LocalDateTime.parse(deadline, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                }
            }
            
            // Try to parse documentType if provided (for backward compatibility)
            Document.DocumentType docType = null;
            if (documentType != null && !documentType.isEmpty()) {
                try {
                    docType = Document.DocumentType.valueOf(documentType);
                } catch (IllegalArgumentException e) {
                    // If not a valid enum, leave as null - it's a custom deadline type
                }
            }
            
            Deadline savedDeadline = deadlineService.createOrUpdateDeadline(deadlineType, docType, deadlineDate, description, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedDeadline);
        } catch (DateTimeParseException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid date format. Expected: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm. Received: " + deadline);
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("details", e.getClass().getSimpleName());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/type/{documentType}")
    public ResponseEntity<?> getDeadlineByType(@PathVariable String documentType) {
        try {
            Document.DocumentType type = Document.DocumentType.valueOf(documentType);
            Deadline deadline = deadlineService.getDeadlineByType(type);
            return ResponseEntity.ok(deadline);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<Deadline>> getAllActiveDeadlines() {
        List<Deadline> deadlines = deadlineService.getAllActiveDeadlines();
        return ResponseEntity.ok(deadlines);
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getDeadlinesForStudent(@PathVariable Long studentId) {
        try {
            List<Deadline> deadlines = deadlineService.getAllActiveDeadlines();
            return ResponseEntity.ok(deadlines);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_FYP_COMMITTEE')")
    public ResponseEntity<?> getAllDeadlines() {
        try {
            List<Deadline> deadlines = deadlineService.getAllDeadlines();
            if (deadlines == null) {
                deadlines = new java.util.ArrayList<>();
            }
            return ResponseEntity.ok(deadlines);
        } catch (Exception e) {
            e.printStackTrace(); // Log the full stack trace
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage() != null ? e.getMessage() : "Unknown error occurred");
            error.put("details", e.getClass().getSimpleName() + ": " + (e.getMessage() != null ? e.getMessage() : "No message"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('ROLE_FYP_COMMITTEE')")
    public ResponseEntity<?> deactivateDeadline(@PathVariable Long id) {
        try {
            deadlineService.deactivateDeadline(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Deadline deactivated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_FYP_COMMITTEE')")
    public ResponseEntity<?> deleteDeadline(@PathVariable Long id) {
        try {
            deadlineService.deleteDeadline(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Deadline deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}

