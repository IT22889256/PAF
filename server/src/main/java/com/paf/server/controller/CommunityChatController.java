package com.paf.server.controller;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;

import com.paf.server.model.Community;
import com.paf.server.model.CommunityMessage;
import com.paf.server.model.User;
import com.paf.server.repository.CommunityRepository;
import com.paf.server.repository.MessageRepository;
import com.paf.server.repository.UserRepository;
@Controller
public class CommunityChatController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommunityRepository communityRepository;

    @Autowired
    private MessageRepository messageRepository;

    @MessageMapping("/community/{communityId}/sendMessage")
    @SendTo("/topic/community/{communityId}")
    public CommunityMessage sendMessage(
            @DestinationVariable String communityId,
            CommunityMessage message,
            @AuthenticationPrincipal OAuth2User principal) {
        
        String email = (String) principal.getAttribute("email");
        Optional<User> userOpt = userRepository.findByEmail(email);
        Optional<Community> communityOpt = communityRepository.findById(communityId);

        if (userOpt.isEmpty() || communityOpt.isEmpty()) {
            throw new SecurityException("User or community not found");
        }

        User user = userOpt.get();
        Community community = communityOpt.get();

        if (!community.getMembers().contains(user.getId())) {
            throw new SecurityException("Only members can send messages");
        }

        // Set message properties
        message.setSenderId(user.getId());
        message.setTimestamp(LocalDateTime.now());
        message.setCommunityId(communityId);
        
        // Save the message to database
        CommunityMessage savedMessage = messageRepository.save(message);
        
        // Update community's last message info
        community.setLastMessagePreview(message.getContent());
        community.setLastMessageTime(message.getTimestamp());
        communityRepository.save(community);

        return savedMessage;
    }
}