package com.fyp.management.system.fyp_management_system.service;

import com.fyp.management.system.fyp_management_system.model.ProjectGroup;
import com.fyp.management.system.fyp_management_system.model.User;
import com.fyp.management.system.fyp_management_system.repository.ProjectGroupRepository;
import com.fyp.management.system.fyp_management_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectGroupService {

    private final ProjectGroupRepository projectGroupRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProjectGroup createGroup(String name, Long supervisorId, List<Long> studentIds) {
        if (projectGroupRepository.existsByName(name)) {
            throw new RuntimeException("Group name already exists: " + name);
        }

        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new RuntimeException("Supervisor not found"));
        if (supervisor.getRole() != User.Role.SUPERVISOR) {
            throw new RuntimeException("User is not a supervisor");
        }

        ProjectGroup group = ProjectGroup.builder()
                .name(name)
                .supervisor(supervisor)
                .build();
        
        ProjectGroup savedGroup = projectGroupRepository.save(group);

        // Assign users to group
        for (Long studentId : studentIds) {
            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
            if (student.getRole() != User.Role.STUDENT) {
                throw new RuntimeException("User is not a student: " + studentId);
            }
            if (student.getProjectGroup() != null) {
                throw new RuntimeException("Student is already in a group: " + student.getFullName());
            }
            // Link student to group (and implicitly to supervisor via group)
            student.setProjectGroup(savedGroup);
            student.setSupervisor(supervisor); // Maintain direct link for compatibility/redundancy
            userRepository.save(student);
        }

        return savedGroup;
    }

    public List<ProjectGroup> getAllGroups() {
        return projectGroupRepository.findAll();
    }

    public List<ProjectGroup> getGroupsBySupervisor(Long supervisorId) {
        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new RuntimeException("Supervisor not found"));
        return projectGroupRepository.findBySupervisor(supervisor);
    }
    
    public ProjectGroup getGroupById(Long id) {
        return projectGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));
    }

    @Transactional
    public ProjectGroup addStudentToGroup(Long groupId, Long studentId) {
        ProjectGroup group = getGroupById(groupId);
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        
        if (student.getProjectGroup() != null) {
            throw new RuntimeException("Student is already in a group");
        }
        
        student.setProjectGroup(group);
        student.setSupervisor(group.getSupervisor());
        userRepository.save(student);
        
        return group;
    }

    public ProjectGroup getGroupByStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return student.getProjectGroup();
    }
}
