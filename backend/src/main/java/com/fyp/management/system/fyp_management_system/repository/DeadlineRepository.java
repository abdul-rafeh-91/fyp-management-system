package com.fyp.management.system.fyp_management_system.repository;

import com.fyp.management.system.fyp_management_system.model.Deadline;
import com.fyp.management.system.fyp_management_system.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeadlineRepository extends JpaRepository<Deadline, Long> {
    Optional<Deadline> findByDocumentType(Document.DocumentType documentType);
    Optional<Deadline> findByDeadlineType(String deadlineType);
    List<Deadline> findByIsActiveTrue();
}

