package com.fyp.management.system.fyp_management_system.dto;

import lombok.Data;
import java.util.List;

@Data
public class ProjectGroupRequest {
    private String name;
    private Long supervisorId;
    private List<Long> studentIds;
}
