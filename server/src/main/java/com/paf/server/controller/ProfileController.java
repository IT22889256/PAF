package com.paf.server.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import com.paf.server.model.User;
import com.paf.server.repository.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    
    private final UserRepository userRepository;
    
    public ProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @GetMapping
    public ResponseEntity<User> getProfile(@AuthenticationPrincipal OAuth2User principal) {
        String email = (String) principal.getAttribute("email");
        Optional<User> userOpt = userRepository.findByEmail(email);
        return userOpt.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{userId}")
    public ResponseEntity<User> getUserProfile(@PathVariable String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        return userOpt.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping
    public ResponseEntity<User> updateProfile(
            @RequestBody Map<String, Object> updates,
            @AuthenticationPrincipal OAuth2User principal) {
        String email = (String) principal.getAttribute("email");
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = userOpt.get();
        
        // Update fields if they exist in the request
        if (updates.containsKey("name")) {
            user.setName((String) updates.get("name"));
        }
        if (updates.containsKey("bio")) {
            user.setBio((String) updates.get("bio"));
        }
        if (updates.containsKey("location")) {
            user.setLocation((String) updates.get("location"));
        }
        if (updates.containsKey("skills")) {
            user.setSkills((List<String>) updates.get("skills"));
        }
        if (updates.containsKey("interests")) {
            user.setInterests((List<String>) updates.get("interests"));
        }
        
        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }
    
    @PutMapping("/picture")
    public ResponseEntity<User> updateProfilePicture(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal OAuth2User principal) {
        String email = (String) principal.getAttribute("email");
        String pictureUrl = request.get("pictureUrl");
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = userOpt.get();
        user.setProfilePicture(pictureUrl);
        User updatedUser = userRepository.save(user);
        
        return ResponseEntity.ok(updatedUser);
    }

    
}