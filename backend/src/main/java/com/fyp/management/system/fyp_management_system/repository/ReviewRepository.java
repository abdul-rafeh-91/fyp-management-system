package com.fyp.management.system.fyp_management_system.repository;

import com.fyp.management.system.fyp_management_system.model.Document;
import com.fyp.management.system.fyp_management_system.model.Review;
import com.fyp.management.system.fyp_management_system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByDocument(Document document);
    List<Review> findByReviewer(User reviewer);
    List<Review> findByDocumentOrderByReviewedAtDesc(Document document);
}

