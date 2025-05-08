// src/main/java/com/paf/server/controller/NotificationController.java
package com.paf.server.controller;

import com.paf.server.model.Notification;
import com.paf.server.repository.UserRepository;
import com.paf.server.service.NotificationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    @Autowired
private UserRepository userRepository; // Your User repository

    private String getUserIDFromEmail(String email) {
    return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"))
            .getId();
}
   
    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

   @GetMapping
public ResponseEntity<?> getNotifications(@AuthenticationPrincipal OAuth2User principal) {

    System.out.println("---- Notification Request Received ----");
    System.out.println("Principal: " + (principal != null ? principal.getName() : "NULL"));
    
    if (principal == null) {
        System.out.println("ERROR: Unauthenticated request");
        return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
    }
    String userEmail = principal.getAttribute("email");
    System.out.println(userEmail);
    System.out.println(principal);
    
    // String userId = principal.getAttribute("id"); 
    System.out.println(principal);
    String userId = getUserIDFromEmail(userEmail);
    System.out.println("User ID: " + userId);
    
    List<Notification> notifications = notificationService.getUserNotifications(userId);
    System.out.println("Found " + notifications.size() + " notifications");
    
    return ResponseEntity.ok(notifications);
}

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        String userId = principal.getAttribute("sub");
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userId)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id, 
                                      @AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        String userId = principal.getAttribute("sub");
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }
}