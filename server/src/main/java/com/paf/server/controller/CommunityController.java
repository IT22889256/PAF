package com.paf.server.controller;


import com.paf.server.model.Community;
import com.paf.server.model.CommunityMessage;
import com.paf.server.model.User;
import com.paf.server.repository.CommunityRepository;
import com.paf.server.repository.UserRepository;
import com.paf.server.repository.MessageRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/communities")
public class CommunityController {

    private final CommunityRepository communityRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

   public CommunityController(CommunityRepository communityRepository, 
                         UserRepository userRepository,
                         MessageRepository messageRepository) {
    this.communityRepository = communityRepository;
    this.userRepository = userRepository;
    this.messageRepository = messageRepository;
}

    // Add this to CommunityController.java
@GetMapping("/user/{userId}")
public ResponseEntity<List<Community>> getUserCommunities(@PathVariable String userId) {
    // Get communities where user is a member
    List<Community> memberCommunities = communityRepository.findByMembersContaining(userId);
    
    // Get communities owned by user
    List<Community> ownedCommunities = communityRepository.findByOwnerId(userId);
    
    // Combine and remove duplicates
    List<Community> allCommunities = new ArrayList<>(memberCommunities);
    ownedCommunities.stream()
        .filter(community -> !allCommunities.contains(community))
        .forEach(allCommunities::add);
    
    return ResponseEntity.ok(allCommunities);
}

    // Create a new community
    @PostMapping
    public ResponseEntity<Community> createCommunity(
            @RequestBody Community community,
            @AuthenticationPrincipal OAuth2User principal) {
        String email = (String) principal.getAttribute("email");
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        community.setOwnerId(user.getId());
        community.setCreatedAt(LocalDateTime.now());
        community.setUpdatedAt(LocalDateTime.now());
        
        // Add owner as first member
        community.getMembers().add(user.getId());
        
        Community savedCommunity = communityRepository.save(community);
        
        // Update user's owned communities
        user.getOwnedCommunities().add(savedCommunity.getId());
        userRepository.save(user);
        
        return ResponseEntity.ok(savedCommunity);
    }

    // Get all public communities
    @GetMapping
    public ResponseEntity<List<Community>> getAllCommunities() {
        List<Community> communities = communityRepository.findByIsPrivate(false);
        return ResponseEntity.ok(communities);
    }

    // Get community by ID
    @GetMapping("/{id}")
    public ResponseEntity<Community> getCommunity(@PathVariable String id) {
        Optional<Community> communityOpt = communityRepository.findById(id);
        return communityOpt.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
    }

    // Join a community
    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinCommunity(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal) {
        String email = (String) principal.getAttribute("email");
        return handleCommunityMembership(id, email, true);
    }

    // Leave a community
    @PostMapping("/{id}/leave")
    public ResponseEntity<?> leaveCommunity(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal) {
        String email = (String) principal.getAttribute("email");
        return handleCommunityMembership(id, email, false);
    }

    // Send a message to community
  @PostMapping("/{id}/messages")
public ResponseEntity<?> sendMessage(
        @PathVariable String id,
        @RequestBody CommunityMessage message,
        @AuthenticationPrincipal OAuth2User principal) {
    String email = (String) principal.getAttribute("email");
    Optional<User> userOpt = userRepository.findByEmail(email);
    Optional<Community> communityOpt = communityRepository.findById(id);
    
    if (userOpt.isEmpty() || communityOpt.isEmpty()) {
        return ResponseEntity.notFound().build();
    }

    Community community = communityOpt.get();
    User user = userOpt.get();
    
    if (!community.getMembers().contains(user.getId())) {
        // Return a proper error response with status code
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "You must be a member to send messages");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    message.setSenderId(user.getId());
    message.setTimestamp(LocalDateTime.now());
    message.setCommunityId(id);
    
    CommunityMessage savedMessage = messageRepository.save(message);
    
    // Update community's last message info
    community.setLastMessagePreview(message.getContent());
    community.setLastMessageTime(message.getTimestamp());
    communityRepository.save(community);
    
    return ResponseEntity.ok(savedMessage);
}

    // Helper method for join/leave operations
    private ResponseEntity<?> handleCommunityMembership(String communityId, String email, boolean isJoining) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        Optional<Community> communityOpt = communityRepository.findById(communityId);
        
        if (userOpt.isEmpty() || communityOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        Community community = communityOpt.get();
        
        if (isJoining) {
            if (community.getMembers().contains(user.getId())) {
                return ResponseEntity.badRequest().body("Already a member");
            }
            community.getMembers().add(user.getId());
            user.getCommunities().add(communityId);
        } else {
            if (!community.getMembers().contains(user.getId())) {
                return ResponseEntity.badRequest().body("Not a member");
            }
            community.getMembers().remove(user.getId());
            user.getCommunities().remove(communityId);
        }
        
        communityRepository.save(community);
        userRepository.save(user);
        
        return ResponseEntity.ok().build();
    }

    @GetMapping("/users/{userId}")
public ResponseEntity<User> getUserById(@PathVariable String userId) {
    Optional<User> userOpt = userRepository.findById(userId);
    return userOpt.map(ResponseEntity::ok)
                 .orElse(ResponseEntity.notFound().build());
}

    @GetMapping("/{communityId}/messages")
public ResponseEntity<List<CommunityMessage>> getCommunityMessages(
        @PathVariable String communityId,
        @AuthenticationPrincipal OAuth2User principal) {
    
    String email = principal.getAttribute("email");
    Optional<User> userOpt = userRepository.findByEmail(email);
    
    if (userOpt.isEmpty() || !communityRepository.existsByIdAndMembersContaining(communityId, userOpt.get().getId())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    
    List<CommunityMessage> messages = messageRepository.findByCommunityIdOrderByTimestampAsc(communityId);
    return ResponseEntity.ok(messages);
}

@GetMapping("/{communityId}/unread-count")
public ResponseEntity<Long> getUnreadMessageCount(
        @PathVariable String communityId,
        @AuthenticationPrincipal OAuth2User principal) {
    
    String email = principal.getAttribute("email");
    Optional<User> userOpt = userRepository.findByEmail(email);
    
    if (userOpt.isEmpty() || !communityRepository.existsByIdAndMembersContaining(communityId, userOpt.get().getId())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    
    long count = messageRepository.countByCommunityIdAndReadFalseAndSenderIdNot(
        communityId, userOpt.get().getId());
    return ResponseEntity.ok(count);
}

@PostMapping("/{communityId}/mark-as-read")
public ResponseEntity<Void> markMessagesAsRead(
        @PathVariable String communityId,
        @AuthenticationPrincipal OAuth2User principal) {
    
    String email = principal.getAttribute("email");
    Optional<User> userOpt = userRepository.findByEmail(email);
    
    if (userOpt.isEmpty() || !communityRepository.existsByIdAndMembersContaining(communityId, userOpt.get().getId())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    
    List<CommunityMessage> unreadMessages = messageRepository.findByCommunityIdAndReadFalseAndSenderIdNot(
        communityId, userOpt.get().getId());
    
    unreadMessages.forEach(msg -> msg.setRead(true));
    messageRepository.saveAll(unreadMessages);
    
    return ResponseEntity.ok().build();
}
}
