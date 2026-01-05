package com.fyp.management.system.fyp_management_system.repository;

import com.fyp.management.system.fyp_management_system.model.Document;
import com.fyp.management.system.fyp_management_system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByStudent(User student);
    List<Document> findBySupervisor(User supervisor);
    List<Document> findBySupervisorAndIsSubmittedTrue(User supervisor);
    List<Document> findByType(Document.DocumentType type);
    List<Document> findByStatus(Document.Status status);
    List<Document> findByStudentAndType(User student, Document.DocumentType type);
    List<Document> findByStudentAndCustomType(User student, String customType);
    List<Document> findByIsSubmittedTrue();
    List<Document> findByStatusIn(List<Document.Status> statuses);
    List<Document> findByStudentIn(List<User> students);
    List<Document> findByProjectGroup(com.fyp.management.system.fyp_management_system.model.ProjectGroup projectGroup);
}

