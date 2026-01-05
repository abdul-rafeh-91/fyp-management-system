package com.fyp.management.system.fyp_management_system.controller;

import com.fyp.management.system.fyp_management_system.model.User;
import com.fyp.management.system.fyp_management_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class UserController {
    
    private final UserService userService;
    
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/email/{email}")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        try {
            User user = userService.getUserByEmail(email);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/role/{role}")
    @PreAuthorize("hasAnyRole('FYP_COMMITTEE', 'SUPERVISOR')")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable String role) {
        try {
            User.Role userRole = User.Role.valueOf(role);
            List<User> users = userService.getUsersByRole(userRole);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_FYP_COMMITTEE')")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
        try {
            User user = userService.updateUser(id, updatedUser);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('ROLE_FYP_COMMITTEE')")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        try {
            userService.deactivateUser(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "User deactivated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PatchMapping("/{id}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> passwordData) {
        try {
            String oldPassword = passwordData.get("oldPassword");
            String newPassword = passwordData.get("newPassword");
            
            if (oldPassword == null || newPassword == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Old password and new password are required");
                return ResponseEntity.badRequest().body(error);
            }
            
            userService.changePassword(id, oldPassword, newPassword);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password changed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PatchMapping("/{id}/avatar")
    public ResponseEntity<?> updateAvatar(
            @PathVariable Long id,
            @RequestBody Map<String, String> avatarData) {
        try {
            String avatarUrl = avatarData.get("avatarUrl");
            
            if (avatarUrl == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Avatar URL is required");
                return ResponseEntity.badRequest().body(error);
            }
            
            User user = userService.updateAvatar(id, avatarUrl);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @DeleteMapping("/{id}/avatar")
    public ResponseEntity<?> removeAvatar(@PathVariable Long id) {
        try {
            User user = userService.removeAvatar(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PatchMapping("/{id}/theme")
    public ResponseEntity<?> updateTheme(
            @PathVariable Long id,
            @RequestBody Map<String, String> themeData) {
        try {
            String theme = themeData.get("theme");
            
            if (theme == null || (!theme.equals("light") && !theme.equals("dark"))) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Valid theme is required (light or dark)");
                return ResponseEntity.badRequest().body(error);
            }
            
            User user = userService.updateTheme(id, theme);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PatchMapping("/{studentId}/assign-supervisor/{supervisorId}")
    @PreAuthorize("hasAuthority('ROLE_FYP_COMMITTEE')")
    public ResponseEntity<?> assignSupervisorToStudent(
            @PathVariable Long studentId,
            @PathVariable Long supervisorId) {
        try {
            userService.assignSupervisorToStudent(studentId, supervisorId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Supervisor assigned to student successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PatchMapping("/supervisor/{supervisorId}/assign-all-students")
    @PreAuthorize("hasAuthority('ROLE_FYP_COMMITTEE')")
    public ResponseEntity<?> assignSupervisorToAllStudents(@PathVariable Long supervisorId) {
        try {
            userService.assignSupervisorToAllStudents(supervisorId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Supervisor assigned to all students successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    @GetMapping("/supervisor/{supervisorId}/students")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'FYP_COMMITTEE')")
    public ResponseEntity<List<User>> getSupervisedStudents(@PathVariable Long supervisorId) {
        try {
            List<User> students = userService.getSupervisedStudents(supervisorId);
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

