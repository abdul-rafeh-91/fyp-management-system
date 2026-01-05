package com.fyp.management.system.fyp_management_system.service;

import com.fyp.management.system.fyp_management_system.dto.DocumentDto;
import com.fyp.management.system.fyp_management_system.dto.DocumentVersionDto;
import com.fyp.management.system.fyp_management_system.model.*;
import com.fyp.management.system.fyp_management_system.repository.DeadlineRepository;
import com.fyp.management.system.fyp_management_system.repository.DocumentRepository;
import com.fyp.management.system.fyp_management_system.repository.DocumentVersionRepository;
import com.fyp.management.system.fyp_management_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {
    
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final DeadlineRepository deadlineRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    
    @Transactional
    public Document createDocument(Long studentId, Document.DocumentType type, String customType, String title, String description, MultipartFile file) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        
        if (student.getRole() != User.Role.STUDENT) {
            throw new RuntimeException("Only students can create documents");
        }
        
        ProjectGroup group = student.getProjectGroup();
        
        // Check if document of this type already exists for GROUP (if in group) or STUDENT (if solo)
        if (group != null) {
            // Logic for Group: Check if ANY valid document of this type exists for the group
            // We need a new repository method for this: findByProjectGroupAndType
            // But standard repository might not have it yet.
            // For now, let's filter manually or assume we need to update repository.
            // Let's rely on finding by Student is NOT enough.
            // We need to implement findByProjectGroupAndType in repository or loop.
            
            // Simplest robust way without changing Repo interface too much yet:
            // Check existing docs of the group
            boolean exists = group.getDocuments().stream().anyMatch(d -> 
                (type != null && d.getType() == type) || 
                (customType != null && customType.equals(d.getCustomType()))
            );
            
            if (exists) {
                 throw new RuntimeException("Document of this type already exists for your Group");
            }
        } else {
             // Fallback to old student-check logic
            if (type != null) {
                List<Document> existingDocs = documentRepository.findByStudentAndType(student, type);
                if (!existingDocs.isEmpty()) {
                    throw new RuntimeException("Document of type " + type + " already exists for this student");
                }
            } else if (customType != null) {
                List<Document> existingDocs = documentRepository.findByStudentAndCustomType(student, customType);
                if (!existingDocs.isEmpty()) {
                    throw new RuntimeException("Document of type " + customType + " already exists for this student");
                }
            }
        }
        
        // Store file
        String storagePath = (group != null) ? "groups/" + group.getId() : "documents/" + studentId;
        String filePath = fileStorageService.storeFile(file, storagePath);
        
        // Get deadline... (same as before)
        LocalDateTime deadline = null;
        if (type != null) {
            deadline = deadlineRepository.findByDocumentType(type).map(Deadline::getDeadline).orElse(null);
        } else if (customType != null) {
            deadline = deadlineRepository.findByDeadlineType(customType).map(Deadline::getDeadline).orElse(null);
        }
        
        // Auto-assign supervisor
        User assignedSupervisor = (group != null) ? group.getSupervisor() : student.getSupervisor();
        
        Document document = Document.builder()
                .student(student)
                .projectGroup(group) // Set Group
                .supervisor(assignedSupervisor)
                .type(type)
                .customType(customType)
                .title(title)
                .description(description)
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .version(1)
                .status(Document.Status.DRAFT)
                .isSubmitted(false)
                .isLocked(false)
                .deadline(deadline)
                .isLateSubmission(false)
                .build();
        
        Document savedDocument = documentRepository.save(document);
        
        createDocumentVersion(savedDocument, file, "Initial version", false);
        
        return savedDocument;
    }
    
    @Transactional
    public Document uploadNewVersion(Long documentId, MultipartFile file, String changeDescription) {
        Document document = getDocumentById(documentId);
        
        if (document.getIsLocked()) {
            throw new RuntimeException("Document is locked and cannot be updated");
        }
        
        // Store new file
        String filePath = fileStorageService.storeFile(file, "documents/" + document.getStudent().getId());
        
        // Update document
        document.setFileName(file.getOriginalFilename());
        document.setFilePath(filePath);
        document.setFileSize(file.getSize());
        document.setVersion(document.getVersion() + 1);
        
        // Reset status to DRAFT and isSubmitted to false for revision uploads
        // This allows student to submit the new version
        if (document.getStatus() == Document.Status.SUPERVISOR_REVISION_REQUESTED ||
            document.getStatus() == Document.Status.EVALUATION_COMMITTEE_REVISION_REQUESTED ||
            document.getStatus() == Document.Status.FYP_COMMITTEE_REVISION_REQUESTED) {
            document.setStatus(Document.Status.DRAFT);
            document.setIsSubmitted(false);
        }
        
        Document updatedDocument = documentRepository.save(document);
        
        // Create version record (wasSubmitted = false because new version needs to be submitted)
        createDocumentVersion(updatedDocument, file, changeDescription, false);
        
        return updatedDocument;
    }
    
    private void createDocumentVersion(Document document, MultipartFile file, String changeDescription, Boolean wasSubmitted) {
        String filePath = fileStorageService.storeFile(file, "versions/" + document.getId());
        
        DocumentVersion version = DocumentVersion.builder()
                .document(document)
                .versionNumber(document.getVersion())
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .changeDescription(changeDescription)
                .wasSubmitted(wasSubmitted)
                .build();
        
        documentVersionRepository.save(version);
    }
    
    @Transactional
    public Document submitDocument(Long documentId) {
        Document document = getDocumentById(documentId);
        
        if (document.getIsSubmitted()) {
            throw new RuntimeException("Document is already submitted");
        }
        
        LocalDateTime now = LocalDateTime.now();
        
        // Check if deadline has passed - BLOCK SUBMISSION
        if (document.getDeadline() != null && now.isAfter(document.getDeadline())) {
            throw new RuntimeException("Submission deadline has passed. You can no longer submit this document.");
        }
        
        document.setIsSubmitted(true);
        document.setSubmittedAt(now);
        document.setIsLateSubmission(false);
        document.setStatus(Document.Status.SUBMITTED);
        
        Document submitted = documentRepository.save(document);
        
        User student = document.getStudent();
        
        // Auto-assign supervisor from student if not set on document
        if (document.getSupervisor() == null && student.getSupervisor() != null) {
            document.setSupervisor(student.getSupervisor());
            document = documentRepository.save(document);
        }
        
        // Notify supervisor if assigned (App + Email)
        if (document.getSupervisor() != null) {
            User supervisor = document.getSupervisor();
            
            notificationService.createNotification(
                    supervisor,
                    "New Document Submission",
                    student.getFullName() + " has submitted " + document.getType(),
                    Notification.NotificationType.DOCUMENT_SUBMITTED,
                    "Document",
                    document.getId()
            );
            
            emailService.sendEmail(
                    supervisor.getEmail(),
                    "New Document Submission - Track Sphere",
                    "Dear " + supervisor.getFullName() + ",\n\n" +
                    "A new document has been submitted by your student.\n\n" +
                    "Student: " + student.getFullName() + "\n" +
                    "Document Type: " + document.getType() + "\n" +
                    "Title: " + document.getTitle() + "\n" +
                    "Submitted At: " + now + "\n\n" +
                    "Please log in to Track Sphere to review the document.\n\n" +
                    "Best regards,\nTrack Sphere Team"
            );
        }
        
        return submitted;
    }
    
    @Transactional
    public Document assignSupervisor(Long documentId, Long supervisorId) {
        Document document = getDocumentById(documentId);
        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new RuntimeException("Supervisor not found"));
        
        if (supervisor.getRole() != User.Role.SUPERVISOR) {
            throw new RuntimeException("User is not a supervisor");
        }
        
        document.setSupervisor(supervisor);
        return documentRepository.save(document);
    }
    
    @Transactional
    public Document updateDocumentStatus(Long documentId, Document.Status newStatus) {
        Document document = getDocumentById(documentId);
        document.setStatus(newStatus);
        return documentRepository.save(document);
    }
    
    public Document getDocumentById(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }
    
    public List<Document> getDocumentsByStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        
        // If student is in a group, return ALL group documents
        if (student.getProjectGroup() != null) {
            return documentRepository.findByProjectGroup(student.getProjectGroup());
        }
        
        return documentRepository.findByStudent(student);
    }
    
    public List<Document> getDocumentsBySupervisor(Long supervisorId) {
        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new RuntimeException("Supervisor not found"));
        // Return only submitted documents for supervisor
        // Return all documents for students assigned to this supervisor
        // This ensures even if document doesn't have supervisor_id set, it still shows up
        // as long as the student is assigned to this supervisor
        List<User> students = supervisor.getSupervisedStudents();
        return documentRepository.findByStudentIn(students);
    }
    
    public List<Document> getAllSubmittedDocuments() {
        return documentRepository.findByIsSubmittedTrue();
    }
    
    public List<Document> getDocumentsByStatus(Document.Status status) {
        return documentRepository.findByStatus(status);
    }
    
    public List<DocumentVersion> getDocumentVersions(Long documentId) {
        Document document = getDocumentById(documentId);
        return documentVersionRepository.findByDocumentOrderByVersionNumberDesc(document);
    }
    
    public DocumentVersionDto convertToVersionDto(DocumentVersion version) {
        return DocumentVersionDto.builder()
                .id(version.getId())
                .documentId(version.getDocument().getId())
                .versionNumber(version.getVersionNumber())
                .fileName(version.getFileName())
                .filePath(version.getFilePath())
                .fileSize(version.getFileSize())
                .changeDescription(version.getChangeDescription())
                .wasSubmitted(version.getWasSubmitted())
                .uploadedAt(version.getUploadedAt())
                .build();
    }
    
    public DocumentDto convertToDto(Document document) {
        return DocumentDto.builder()
                .id(document.getId())
                .studentId(document.getStudent().getId())
                .studentName(document.getStudent().getFullName())
                .studentRegistrationNumber(document.getStudent().getRegistrationNumber())
                .supervisorId(document.getSupervisor() != null ? document.getSupervisor().getId() : null)
                .supervisorName(document.getSupervisor() != null ? document.getSupervisor().getFullName() : null)
                .type(document.getType())
                .title(document.getTitle())
                .description(document.getDescription())
                .fileName(document.getFileName())
                .fileSize(document.getFileSize())
                .version(document.getVersion())
                .status(document.getStatus())
                .isSubmitted(document.getIsSubmitted())
                .isLocked(document.getIsLocked())
                .isLateSubmission(document.getIsLateSubmission())
                .submittedAt(document.getSubmittedAt())
                .deadline(document.getDeadline())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }
}

