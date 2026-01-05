package com.fyp.management.system.fyp_management_system.service;

import com.fyp.management.system.fyp_management_system.dto.AuthRequest;
import com.fyp.management.system.fyp_management_system.dto.AuthResponse;
import com.fyp.management.system.fyp_management_system.dto.UserRegistrationDto;
import com.fyp.management.system.fyp_management_system.model.User;
import com.fyp.management.system.fyp_management_system.repository.UserRepository;
import com.fyp.management.system.fyp_management_system.config.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    
    @Transactional
    public User registerUser(UserRegistrationDto registrationDto) {
        // Check if email already exists
        if (userRepository.existsByEmail(registrationDto.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        // Clean registration number (convert empty string to null)
        String regNumber = registrationDto.getRegistrationNumber();
        if (regNumber != null && regNumber.trim().isEmpty()) {
            regNumber = null;
        }
        
        // Check if registration number already exists (for students only)
        if (regNumber != null && 
            userRepository.existsByRegistrationNumber(regNumber)) {
            throw new RuntimeException("Registration number already exists");
        }
        
        User user = User.builder()
                .email(registrationDto.getEmail())
                .password(passwordEncoder.encode(registrationDto.getPassword()))
                .fullName(registrationDto.getFullName())
                .role(registrationDto.getRole())
                .registrationNumber(regNumber)
                .phoneNumber(registrationDto.getPhoneNumber())
                .department(registrationDto.getDepartment())
                .isActive(true)
                .theme("light") // Default theme for new users
                .build();
        
        return userRepository.save(user);
    }
    
    public AuthResponse login(AuthRequest authRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authRequest.getEmail(),
                        authRequest.getPassword()
                )
        );
        
        User user = userRepository.findByEmail(authRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.getEmail());
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("userId", user.getId());
        
        String token = jwtUtil.generateToken(userDetails, claims);
        
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }
    
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    public List<User> getUsersByRole(User.Role role) {
        return userRepository.findByRole(role);
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    @Transactional
    public User updateUser(Long id, User updatedUser) {
        User user = getUserById(id);
        
        if (updatedUser.getFullName() != null) {
            user.setFullName(updatedUser.getFullName());
        }
        if (updatedUser.getPhoneNumber() != null) {
            user.setPhoneNumber(updatedUser.getPhoneNumber());
        }
        if (updatedUser.getDepartment() != null) {
            user.setDepartment(updatedUser.getDepartment());
        }
        
        return userRepository.save(user);
    }
    
    @Transactional
    public void deactivateUser(Long id) {
        User user = getUserById(id);
        user.setIsActive(false);
        userRepository.save(user);
    }
    
    @Transactional
    public void changePassword(Long id, String oldPassword, String newPassword) {
        User user = getUserById(id);
        
        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }
        
        // Validate new password
        if (newPassword == null || newPassword.length() < 8) {
            throw new RuntimeException("New password must be at least 8 characters long");
        }
        
        // Encode and save new password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
    
    @Transactional
    public User updateAvatar(Long id, String avatarUrl) {
        User user = getUserById(id);
        user.setAvatarUrl(avatarUrl);
        return userRepository.save(user);
    }
    
    @Transactional
    public User updateTheme(Long id, String theme) {
        User user = getUserById(id);
        user.setTheme(theme);
        return userRepository.save(user);
    }
    
    @Transactional
    public User removeAvatar(Long id) {
        User user = getUserById(id);
        user.setAvatarUrl(null);
        return userRepository.save(user);
    }
    
    @Transactional
    public void assignSupervisorToStudent(Long studentId, Long supervisorId) {
        User student = getUserById(studentId);
        if (student.getRole() != User.Role.STUDENT) {
            throw new RuntimeException("User is not a student");
        }
        
        User supervisor = getUserById(supervisorId);
        if (supervisor.getRole() != User.Role.SUPERVISOR) {
            throw new RuntimeException("User is not a supervisor");
        }
        
        student.setSupervisor(supervisor);
        userRepository.save(student);
    }
    
    @Transactional
    public void assignSupervisorToAllStudents(Long supervisorId) {
        User supervisor = getUserById(supervisorId);
        if (supervisor.getRole() != User.Role.SUPERVISOR) {
            throw new RuntimeException("User is not a supervisor");
        }
        
        // Get all students
        List<User> students = userRepository.findByRole(User.Role.STUDENT);
        
        // Assign supervisor to all students
        for (User student : students) {
            student.setSupervisor(supervisor);
        }
        
        userRepository.saveAll(students);
    }
    public List<User> getSupervisedStudents(Long supervisorId) {
        User supervisor = getUserById(supervisorId);
        if (supervisor.getRole() != User.Role.SUPERVISOR) {
            throw new RuntimeException("User is not a supervisor");
        }
        return supervisor.getSupervisedStudents();
    }
}

