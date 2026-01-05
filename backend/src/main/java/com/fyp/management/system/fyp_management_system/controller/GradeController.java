package com.fyp.management.system.fyp_management_system.controller;

import com.fyp.management.system.fyp_management_system.dto.GradeDto;
import com.fyp.management.system.fyp_management_system.model.Grade;
import com.fyp.management.system.fyp_management_system.service.GradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class GradeController {
    
    private final GradeService gradeService;
    
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_EVALUATOR', 'ROLE_FYP_COMMITTEE')")
    public ResponseEntity<?> createGrade(
            @Valid @RequestBody GradeDto gradeDto,
            @RequestParam Long evaluatorId) {
        try {
            Grade grade = gradeService.createGrade(gradeDto, evaluatorId);
            GradeDto dto = gradeService.convertToDto(grade);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVALUATOR', 'ROLE_FYP_COMMITTEE')")
    public ResponseEntity<?> updateGrade(
            @PathVariable Long id,
            @Valid @RequestBody GradeDto gradeDto) {
        try {
            Grade grade = gradeService.updateGrade(id, gradeDto);
            GradeDto dto = gradeService.convertToDto(grade);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PatchMapping("/{id}/release")
    @PreAuthorize("hasAnyAuthority('ROLE_EVALUATOR', 'ROLE_FYP_COMMITTEE')")
    public ResponseEntity<?> releaseGrade(@PathVariable Long id) {
        try {
            Grade grade = gradeService.releaseGrade(id);
            GradeDto dto = gradeService.convertToDto(grade);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PatchMapping("/document/{documentId}/release-all")
    @PreAuthorize("hasAuthority('ROLE_FYP_COMMITTEE')")
    public ResponseEntity<?> releaseAllGradesForDocument(@PathVariable Long documentId) {
        try {
            gradeService.releaseAllGradesForDocument(documentId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "All grades released successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getGrade(@PathVariable Long id) {
        try {
            Grade grade = gradeService.getGradeById(id);
            GradeDto dto = gradeService.convertToDto(grade);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/document/{documentId}")
    public ResponseEntity<List<GradeDto>> getGradesByDocument(@PathVariable Long documentId) {
        List<Grade> grades = gradeService.getGradesByDocument(documentId);
        List<GradeDto> dtos = grades.stream()
                .map(gradeService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/document/{documentId}/released")
    public ResponseEntity<List<GradeDto>> getReleasedGradesByDocument(@PathVariable Long documentId) {
        List<Grade> grades = gradeService.getReleasedGradesByDocument(documentId);
        List<GradeDto> dtos = grades.stream()
                .map(gradeService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/evaluator/{evaluatorId}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVALUATOR', 'ROLE_FYP_COMMITTEE')")
    public ResponseEntity<List<GradeDto>> getGradesByEvaluator(@PathVariable Long evaluatorId) {
        List<Grade> grades = gradeService.getGradesByEvaluator(evaluatorId);
        List<GradeDto> dtos = grades.stream()
                .map(gradeService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/document/{documentId}/total-score")
    public ResponseEntity<Map<String, Double>> getTotalScore(@PathVariable Long documentId) {
        Double totalScore = gradeService.calculateTotalScore(documentId);
        Double totalMaxScore = gradeService.calculateTotalMaxScore(documentId);
        
        Map<String, Double> result = new HashMap<>();
        result.put("totalScore", totalScore);
        result.put("totalMaxScore", totalMaxScore);
        result.put("percentage", totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0.0);
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/student/{studentId}/dmc")
    @PreAuthorize("hasAnyAuthority('ROLE_STUDENT', 'ROLE_FYP_COMMITTEE')")
    public ResponseEntity<Map<String, Object>> getStudentDMC(@PathVariable Long studentId) {
        try {
            Map<String, Object> dmc = gradeService.getStudentDMC(studentId);
            return ResponseEntity.ok(dmc);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/document/{documentId}/evaluator/{evaluatorId}/has-graded")
    public ResponseEntity<Map<String, Boolean>> hasEvaluatorGradedAllCriteria(
            @PathVariable Long documentId, 
            @PathVariable Long evaluatorId) {
        boolean hasGraded = gradeService.hasEvaluatorGradedAllCriteria(documentId, evaluatorId);
        Map<String, Boolean> result = new HashMap<>();
        result.put("hasGraded", hasGraded);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/document/{documentId}/overall-result")
    public ResponseEntity<Map<String, Object>> getOverallResult(@PathVariable Long documentId) {
        try {
            List<Grade> grades = gradeService.getGradesByDocument(documentId);
            if (grades.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "No grades found for this document");
                return ResponseEntity.badRequest().body(error);
            }
            
            Double totalScore = grades.stream().mapToDouble(Grade::getScore).sum();
            Double totalMaxScore = grades.stream().mapToDouble(Grade::getMaxScore).sum();
            Double percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0.0;
            String letterGrade = gradeService.calculateLetterGrade(percentage);
            Double gpa = gradeService.calculateGPA(letterGrade);
            
            Map<String, Object> result = new HashMap<>();
            result.put("totalScore", totalScore);
            result.put("totalMaxScore", totalMaxScore);
            result.put("percentage", percentage);
            result.put("grade", letterGrade);
            result.put("gpa", gpa);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}

