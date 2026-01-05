package com.fyp.management.system.fyp_management_system.service;

import com.fyp.management.system.fyp_management_system.model.ProjectGroup;
import com.fyp.management.system.fyp_management_system.dto.GradeDto;
import com.fyp.management.system.fyp_management_system.model.Document;
import com.fyp.management.system.fyp_management_system.model.Grade;
import com.fyp.management.system.fyp_management_system.model.Notification;
import com.fyp.management.system.fyp_management_system.model.User;
import com.fyp.management.system.fyp_management_system.repository.DocumentRepository;
import com.fyp.management.system.fyp_management_system.repository.GradeRepository;
import com.fyp.management.system.fyp_management_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GradeService {
    
    private final GradeRepository gradeRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    
    @Transactional
    public Grade createGrade(GradeDto gradeDto, Long evaluatorId) {
        Document document = documentRepository.findById(gradeDto.getDocumentId())
                .orElseThrow(() -> new RuntimeException("Document not found"));
        
        User evaluator = userRepository.findById(evaluatorId)
                .orElseThrow(() -> new RuntimeException("Evaluator not found"));
        
        // Validate evaluator role
        if (evaluator.getRole() != User.Role.EVALUATOR && 
            evaluator.getRole() != User.Role.FYP_COMMITTEE) {
            throw new RuntimeException("Only evaluators and FYP committee can grade documents");
        }
        
        Grade grade = Grade.builder()
                .document(document)
                .evaluator(evaluator)
                .rubricCriteria(gradeDto.getRubricCriteria())
                .score(gradeDto.getScore())
                .maxScore(gradeDto.getMaxScore())
                .feedback(gradeDto.getFeedback())
                .isReleased(false)
                .build();
        
        Grade savedGrade = gradeRepository.save(grade);
        
        // Check if all 6 criteria are graded for this document
        List<Grade> documentGrades = gradeRepository.findByDocument(document);
        // Expected 6 criteria: Problem Definition, Literature Review, Methodology, Implementation, Documentation, Innovation
        if (documentGrades.size() >= 6) {
            // All criteria graded - update document status
            if (document.getStatus() != Document.Status.EVALUATION_COMMITTEE_APPROVED) {
                document.setStatus(Document.Status.EVALUATION_COMMITTEE_APPROVED);
                documentRepository.save(document);
            }
        }
        
        // If graded by EVALUATOR and all criteria are graded, notify FYP Committee (App + Email)
        if (evaluator.getRole() == User.Role.EVALUATOR && documentGrades.size() >= 6) {
            List<User> fypCommitteeMembers = userRepository.findByRole(User.Role.FYP_COMMITTEE);
            
            for (User committeeMember : fypCommitteeMembers) {
                notificationService.createNotification(
                        committeeMember,
                        "Document Graded",
                        document.getStudent().getFullName() + "'s " + document.getType() + " has been fully graded and is ready for review",
                        Notification.NotificationType.GRADE_ASSIGNED,
                        "Document",
                        document.getId()
                );
                
                emailService.sendEmail(
                        committeeMember.getEmail(),
                        "Document Graded - Track Sphere",
                        "Dear " + committeeMember.getFullName() + ",\n\n" +
                        "A document has been fully graded by the evaluation committee.\n\n" +
                        "Student: " + document.getStudent().getFullName() + "\n" +
                        "Document: " + document.getType() + "\n" +
                        "Title: " + document.getTitle() + "\n\n" +
                        "All criteria have been evaluated. Please log in to Track Sphere to review and release the grades.\n\n" +
                        "Best regards,\nTrack Sphere Team"
                );
            }
        }
        
        return savedGrade;
    }
    
    @Transactional
    public Grade updateGrade(Long gradeId, GradeDto gradeDto) {
        Grade grade = getGradeById(gradeId);
        
        if (grade.getIsReleased()) {
            throw new RuntimeException("Cannot update a released grade");
        }
        
        if (gradeDto.getRubricCriteria() != null) {
            grade.setRubricCriteria(gradeDto.getRubricCriteria());
        }
        if (gradeDto.getScore() != null) {
            grade.setScore(gradeDto.getScore());
        }
        if (gradeDto.getMaxScore() != null) {
            grade.setMaxScore(gradeDto.getMaxScore());
        }
        if (gradeDto.getFeedback() != null) {
            grade.setFeedback(gradeDto.getFeedback());
        }
        
        return gradeRepository.save(grade);
    }
    
    @Transactional
    public Grade releaseGrade(Long gradeId) {
        Grade grade = getGradeById(gradeId);
        
        if (grade.getIsReleased()) {
            throw new RuntimeException("Grade is already released");
        }
        
        grade.setIsReleased(true);
        grade.setReleasedAt(LocalDateTime.now());
        
        Grade releasedGrade = gradeRepository.save(grade);
        
        User student = grade.getDocument().getStudent();
        Document document = grade.getDocument();
        ProjectGroup group = document.getProjectGroup();
        
        // Notify student or group (App + Email)
        String title = "Grade Released";
        String message = "Your grade for " + document.getType() + " has been released";
        String emailSubject = "Grade Released - Track Sphere";
        String emailBody = "Your grade for " + document.getType() + " has been released.\n\n" +
                "Document: " + document.getTitle() + "\n" +
                "Score: " + grade.getScore() + "/" + grade.getMaxScore() + "\n\n" +
                "Please log in to Track Sphere to view your detailed grade.";

        if (group != null && group.getMembers() != null) {
            for (User member : group.getMembers()) {
                 sendNotificationAndEmail(member, title, message, emailSubject, emailBody, grade.getId(), "Grade");
            }
        } else {
             sendNotificationAndEmail(student, title, message, emailSubject, emailBody, grade.getId(), "Grade");
        }
        
        return releasedGrade;
    }
    
    @Transactional
    public void releaseAllGradesForDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        
        List<Grade> grades = gradeRepository.findByDocument(document);
        
        if (grades.isEmpty()) {
            throw new RuntimeException("No grades found for this document");
        }
        
        // Release all grades
        for (Grade grade : grades) {
            if (!grade.getIsReleased()) {
                grade.setIsReleased(true);
                grade.setReleasedAt(LocalDateTime.now());
                gradeRepository.save(grade);
            }
        }
        
        // Calculate overall result
        Double totalScore = grades.stream().mapToDouble(Grade::getScore).sum();
        Double totalMaxScore = grades.stream().mapToDouble(Grade::getMaxScore).sum();
        Double percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0.0;
        String letterGrade = calculateLetterGrade(percentage);
        Double gpa = calculateGPA(letterGrade);
        
        // Update document status to FINAL_APPROVED
        document.setStatus(Document.Status.FINAL_APPROVED);
        documentRepository.save(document);
        
        // Notify student or group (App + Email) with overall result
        User student = document.getStudent();
        ProjectGroup group = document.getProjectGroup();
        
        String title = "Grades Released";
        String message = "Your grades for " + document.getType() + " have been released. Overall Grade: " + letterGrade;
        String emailSubject = "Grades Released - Track Sphere";
        String emailBody = "Your grades for " + document.getType() + " have been released.\n\n" +
                "Document: " + document.getTitle() + "\n" +
                "Total Marks: " + String.format("%.2f", totalScore) + "/" + String.format("%.2f", totalMaxScore) + "\n" +
                "Percentage: " + String.format("%.2f", percentage) + "%\n" +
                "Grade: " + letterGrade + "\n" +
                "GPA: " + String.format("%.2f", gpa) + "\n\n" +
                "Please log in to Track Sphere to view your detailed results.";

        if (group != null && group.getMembers() != null) {
            for (User member : group.getMembers()) {
                 sendNotificationAndEmail(member, title, message, emailSubject, emailBody, documentId, "Document");
            }
        } else {
             sendNotificationAndEmail(student, title, message, emailSubject, emailBody, documentId, "Document");
        }
    }

    private void sendNotificationAndEmail(User user, String title, String message, String emailSubject, String emailBody, Long entityId, String entityType) {
        notificationService.createNotification(
                user,
                title,
                message,
                Notification.NotificationType.GRADE_RELEASED,
                entityType,
                entityId
        );
        emailService.sendEmail(
                user.getEmail(),
                emailSubject,
                "Dear " + user.getFullName() + ",\n\n" +
                emailBody + "\n\n" +
                "Best regards,\nTrack Sphere Team"
        );
    }
    
    public Grade getGradeById(Long id) {
        return gradeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Grade not found"));
    }
    
    public List<Grade> getGradesByDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        return gradeRepository.findByDocument(document);
    }
    
    public List<Grade> getReleasedGradesByDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        return gradeRepository.findByDocumentAndIsReleasedTrue(document);
    }
    
    public List<Grade> getGradesByEvaluator(Long evaluatorId) {
        User evaluator = userRepository.findById(evaluatorId)
                .orElseThrow(() -> new RuntimeException("Evaluator not found"));
        return gradeRepository.findByEvaluator(evaluator);
    }
    
    public Double calculateTotalScore(Long documentId) {
        List<Grade> grades = getReleasedGradesByDocument(documentId);
        return grades.stream()
                .mapToDouble(Grade::getScore)
                .sum();
    }
    
    public Double calculateTotalMaxScore(Long documentId) {
        List<Grade> grades = getReleasedGradesByDocument(documentId);
        return grades.stream()
                .mapToDouble(Grade::getMaxScore)
                .sum();
    }
    
    public GradeDto convertToDto(Grade grade) {
        return GradeDto.builder()
                .id(grade.getId())
                .documentId(grade.getDocument().getId())
                .documentTitle(grade.getDocument().getTitle())
                .evaluatorId(grade.getEvaluator().getId())
                .evaluatorName(grade.getEvaluator().getFullName())
                .rubricCriteria(grade.getRubricCriteria())
                .score(grade.getScore())
                .maxScore(grade.getMaxScore())
                .feedback(grade.getFeedback())
                .isReleased(grade.getIsReleased())
                .gradedAt(grade.getGradedAt())
                .releasedAt(grade.getReleasedAt())
                .build();
    }
    
    public Map<String, Object> getStudentDMC(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        
        if (student.getRole() != User.Role.STUDENT) {
            throw new RuntimeException("User is not a student");
        }
        
        List<Document> documents;
        if (student.getProjectGroup() != null) {
            documents = documentRepository.findByProjectGroup(student.getProjectGroup());
        } else {
            documents = documentRepository.findByStudent(student);
        }
        
        Map<String, Object> dmc = new HashMap<>();
        dmc.put("studentId", student.getId());
        dmc.put("studentName", student.getFullName());
        dmc.put("registrationNumber", student.getRegistrationNumber());
        dmc.put("department", student.getDepartment());
        
        List<Map<String, Object>> documentGrades = new ArrayList<>();
        Double overallTotal = 0.0;
        Double overallMaxTotal = 0.0;
        
        for (Document document : documents) {
            List<Grade> grades = gradeRepository.findByDocumentAndIsReleasedTrue(document);
            
            if (!grades.isEmpty()) {
                Double totalScore = grades.stream().mapToDouble(Grade::getScore).sum();
                Double totalMaxScore = grades.stream().mapToDouble(Grade::getMaxScore).sum();
                Double percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0.0;
                
                Map<String, Object> docGrade = new HashMap<>();
                docGrade.put("documentId", document.getId());
                docGrade.put("documentType", document.getType());
                docGrade.put("documentTitle", document.getTitle());
                docGrade.put("totalScore", totalScore);
                docGrade.put("totalMaxScore", totalMaxScore);
                docGrade.put("percentage", percentage);
                String docGradeLetter = calculateLetterGrade(percentage);
                docGrade.put("grade", docGradeLetter);
                docGrade.put("gpa", calculateGPA(docGradeLetter));
                
                documentGrades.add(docGrade);
                overallTotal += totalScore;
                overallMaxTotal += totalMaxScore;
            }
        }
        
        Double overallPercentage = overallMaxTotal > 0 ? (overallTotal / overallMaxTotal) * 100 : 0.0;
        String overallGrade = calculateLetterGrade(overallPercentage);
        
        // Calculate CGPA as average of all document GPAs
        Double overallGPA = 0.0;
        if (!documentGrades.isEmpty()) {
            Double totalGPA = documentGrades.stream()
                    .mapToDouble(doc -> ((Double) doc.get("gpa")))
                    .sum();
            overallGPA = totalGPA / documentGrades.size();
        }
        
        dmc.put("documentGrades", documentGrades);
        dmc.put("overallTotalScore", overallTotal);
        dmc.put("overallMaxScore", overallMaxTotal);
        dmc.put("overallPercentage", overallPercentage);
        dmc.put("overallGrade", overallGrade);
        dmc.put("overallGPA", overallGPA);
        
        return dmc;
    }
    
    public boolean hasEvaluatorGradedAllCriteria(Long documentId, Long evaluatorId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        User evaluator = userRepository.findById(evaluatorId)
                .orElseThrow(() -> new RuntimeException("Evaluator not found"));
        
        List<Grade> grades = gradeRepository.findByDocumentAndEvaluator(document, evaluator);
        // Check if all 6 criteria are graded
        return grades.size() >= 6;
    }
    
    public Double calculateGPA(String letterGrade) {
        switch (letterGrade) {
            case "A": return 4.0;
            case "A-": return 3.7;
            case "B+": return 3.3;
            case "B": return 3.0;
            case "B-": return 2.7;
            case "C+": return 2.3;
            case "C": return 2.0;
            case "C-": return 1.7;
            case "F": return 0.0;
            default: return 0.0;
        }
    }
    
    public String calculateLetterGrade(Double percentage) {
        if (percentage >= 85) return "A";
        else if (percentage >= 80) return "A-";
        else if (percentage >= 75) return "B+";
        else if (percentage >= 70) return "B";
        else if (percentage >= 65) return "B-";
        else if (percentage >= 60) return "C+";
        else if (percentage >= 55) return "C";
        else if (percentage >= 50) return "C-";
        else return "F";
    }
}

