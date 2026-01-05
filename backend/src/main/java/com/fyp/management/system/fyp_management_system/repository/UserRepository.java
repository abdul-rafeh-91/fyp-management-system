package com.fyp.management.system.fyp_management_system.repository;

import com.fyp.management.system.fyp_management_system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByRegistrationNumber(String registrationNumber);
    List<User> findByRole(User.Role role);
    List<User> findByIsActive(Boolean isActive);
    Boolean existsByEmail(String email);
    Boolean existsByRegistrationNumber(String registrationNumber);
}

