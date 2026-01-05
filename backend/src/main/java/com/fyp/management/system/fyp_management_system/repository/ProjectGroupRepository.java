package com.fyp.management.system.fyp_management_system.repository;

import com.fyp.management.system.fyp_management_system.model.ProjectGroup;
import com.fyp.management.system.fyp_management_system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectGroupRepository extends JpaRepository<ProjectGroup, Long> {
    Optional<ProjectGroup> findByName(String name);
    List<ProjectGroup> findBySupervisor(User supervisor);
    boolean existsByName(String name);
}
