package com.fyp.management.system.fyp_management_system.repository;

import com.fyp.management.system.fyp_management_system.model.Document;
import com.fyp.management.system.fyp_management_system.model.Grade;
import com.fyp.management.system.fyp_management_system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {
    List<Grade> findByDocument(Document document);
    List<Grade> findByEvaluator(User evaluator);
    List<Grade> findByDocumentAndEvaluator(Document document, User evaluator);
    List<Grade> findByDocumentAndIsReleasedTrue(Document document);
    List<Grade> findByIsReleasedTrue();
}

