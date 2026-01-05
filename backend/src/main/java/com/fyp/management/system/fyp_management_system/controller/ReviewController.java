package com.fyp.management.system.fyp_management_system.controller;

import com.fyp.management.system.fyp_management_system.dto.ReviewDto;
import com.fyp.management.system.fyp_management_system.model.Review;
import com.fyp.management.system.fyp_management_system.service.ReviewService;
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
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ReviewController {
    
    private final ReviewService reviewService;
    
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERVISOR', 'ROLE_FYP_COMMITTEE', 'ROLE_EVALUATOR')")
    public ResponseEntity<?> createReview(
            @Valid @RequestBody ReviewDto reviewDto,
            @RequestParam Long reviewerId) {
        try {
            Review review = reviewService.createReview(reviewDto, reviewerId);
            ReviewDto dto = reviewService.convertToDto(review);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getReview(@PathVariable Long id) {
        try {
            Review review = reviewService.getReviewById(id);
            ReviewDto dto = reviewService.convertToDto(review);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/document/{documentId}")
    public ResponseEntity<List<ReviewDto>> getReviewsByDocument(@PathVariable Long documentId) {
        List<Review> reviews = reviewService.getReviewsByDocument(documentId);
        List<ReviewDto> dtos = reviews.stream()
                .map(reviewService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/reviewer/{reviewerId}")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'FYP_COMMITTEE')")
    public ResponseEntity<List<ReviewDto>> getReviewsByReviewer(@PathVariable Long reviewerId) {
        List<Review> reviews = reviewService.getReviewsByReviewer(reviewerId);
        List<ReviewDto> dtos = reviews.stream()
                .map(reviewService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}

