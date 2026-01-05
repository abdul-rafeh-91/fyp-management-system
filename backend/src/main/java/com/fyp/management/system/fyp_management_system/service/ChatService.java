package com.fyp.management.system.fyp_management_system.service;

import com.fyp.management.system.fyp_management_system.model.ChatMessage;
import com.fyp.management.system.fyp_management_system.model.ProjectGroup;
import com.fyp.management.system.fyp_management_system.model.User;
import com.fyp.management.system.fyp_management_system.repository.ChatMessageRepository;
import com.fyp.management.system.fyp_management_system.repository.ProjectGroupRepository;
import com.fyp.management.system.fyp_management_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ProjectGroupRepository projectGroupRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChatMessage sendMessage(Long groupId, Long senderId, String content) {
        ProjectGroup group = projectGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Verify sender belongs to group (either student member or the supervisor)
        boolean isMember = sender.getProjectGroup() != null && sender.getProjectGroup().getId().equals(groupId);
        boolean isSupervisor = group.getSupervisor().getId().equals(senderId);
        
        // Also allow committee or others? For now, restrict to group context.
        if (!isMember && !isSupervisor) {
            throw new RuntimeException("User is not a member of this group");
        }

        ChatMessage message = ChatMessage.builder()
                .projectGroup(group)
                .sender(sender)
                .content(content)
                .build();
        
        return chatMessageRepository.save(message);
    }

    public List<ChatMessage> getGroupMessages(Long groupId) {
        ProjectGroup group = projectGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        return chatMessageRepository.findByProjectGroupOrderBySentAtAsc(group);
    }
}
