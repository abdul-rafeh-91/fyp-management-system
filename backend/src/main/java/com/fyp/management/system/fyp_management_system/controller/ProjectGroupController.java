package com.fyp.management.system.fyp_management_system.controller;

import com.fyp.management.system.fyp_management_system.model.ProjectGroup;
import com.fyp.management.system.fyp_management_system.service.ProjectGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ProjectGroupController {

    private final ProjectGroupService projectGroupService;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_FYP_COMMITTEE')")
    public ResponseEntity<?> createGroup(@RequestBody com.fyp.management.system.fyp_management_system.dto.ProjectGroupRequest request) {
        try {
            ProjectGroup group = projectGroupService.createGroup(
                request.getName(), 
                request.getSupervisorId(), 
                request.getStudentIds()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(group);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_FYP_COMMITTEE')")
    public ResponseEntity<List<ProjectGroup>> getAllGroups() {
        return ResponseEntity.ok(projectGroupService.getAllGroups());
    }

    @GetMapping("/supervisor/{supervisorId}")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'FYP_COMMITTEE')")
    public ResponseEntity<List<ProjectGroup>> getGroupsBySupervisor(@PathVariable Long supervisorId) {
        return ResponseEntity.ok(projectGroupService.getGroupsBySupervisor(supervisorId));
    }
    
    @PostMapping("/{groupId}/students/{studentId}")
    @PreAuthorize("hasAuthority('ROLE_FYP_COMMITTEE')")
    public ResponseEntity<?> addStudentToGroup(@PathVariable Long groupId, @PathVariable Long studentId) {
        try {
            ProjectGroup group = projectGroupService.addStudentToGroup(groupId, studentId);
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'FYP_COMMITTEE', 'SUPERVISOR')")
    public ResponseEntity<ProjectGroup> getGroupByStudent(@PathVariable Long studentId) {
        ProjectGroup group = projectGroupService.getGroupByStudent(studentId);
        if (group == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(group);
    }
}
