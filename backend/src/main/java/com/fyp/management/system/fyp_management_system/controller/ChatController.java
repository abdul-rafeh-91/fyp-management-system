package com.fyp.management.system.fyp_management_system.controller;

import com.fyp.management.system.fyp_management_system.model.ChatMessage;
import com.fyp.management.system.fyp_management_system.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(
            @RequestParam Long groupId,
            @RequestParam Long senderId,
            @RequestBody String content) {
        try {
            ChatMessage message = chatService.sendMessage(groupId, senderId, content);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<ChatMessage>> getGroupMessages(@PathVariable Long groupId) {
        return ResponseEntity.ok(chatService.getGroupMessages(groupId));
    }
}
