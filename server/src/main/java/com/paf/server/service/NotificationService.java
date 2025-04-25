// src/main/java/com/paf/server/service/NotificationService.java
package com.paf.server.service;

import com.paf.server.model.Notification;
import com.paf.server.model.Notification.NotificationType;
import com.paf.server.repository.NotificationRepository;
import com.paf.server.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private final WebSocketService webSocketService;

public NotificationService(NotificationRepository notificationRepository,
                         UserRepository userRepository,
                         WebSocketService webSocketService) {
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
    this.webSocketService = webSocketService;
    
}

public Notification createNotification(String recipientId, String senderId, 
                                    Notification.NotificationType type, 
                                    String content, String relatedEntityId) {
    Notification notification = new Notification();
    notification.setRecipientId(recipientId);
    notification.setSenderId(senderId);
    notification.setType(type);
    notification.setContent(content);
    notification.setRelatedEntityId(relatedEntityId);
   
    
    Notification savedNotification = notificationRepository.save(notification);
    
    // Send real-time notification
    webSocketService.sendNotification(recipientId, savedNotification);
    
    return savedNotification;
}

    public void createPostLikeNotification(String postId, String likerId, String postOwnerId) {
        if (likerId.equals(postOwnerId)) return; // Don't notify for own likes
        
        String likerName = userRepository.findById(likerId)
            .map(user -> user.getName())
            .orElse("Someone");
            
        Notification notification = new Notification();
        notification.setRecipientId(postOwnerId);
        notification.setSenderId(likerId);
        notification.setType(NotificationType.POST_LIKE);
        notification.setContent(likerName + " liked your post");
        notification.setRelatedEntityId(postId);
        
        notificationRepository.save(notification);
    }

    public void createCommentLikeNotification(String commentId, String likerId, 
                                            String commentOwnerId, String postId) {
        if (likerId.equals(commentOwnerId)) return;
        
        String likerName = userRepository.findById(likerId)
            .map(user -> user.getName())
            .orElse("Someone");
            
        Notification notification = new Notification();
        notification.setRecipientId(commentOwnerId);
        notification.setSenderId(likerId);
        notification.setType(NotificationType.COMMENT_LIKE);
        notification.setContent(likerName + " liked your comment");
        notification.setRelatedEntityId(commentId);
        
        notificationRepository.save(notification);
    }

    public void createNewCommentNotification(String postId, String commenterId, 
                                           String postOwnerId, String commentText) {
        if (commenterId.equals(postOwnerId)) return;
        
        String commenterName = userRepository.findById(commenterId)
            .map(user -> user.getName())
            .orElse("Someone");
            
        String preview = commentText.length() > 30 
            ? commentText.substring(0, 30) + "..." 
            : commentText;
            
        Notification notification = new Notification();
        notification.setRecipientId(postOwnerId);
        notification.setSenderId(commenterId);
        notification.setType(NotificationType.NEW_COMMENT);
        notification.setContent(commenterName + " commented: " + preview);
        notification.setRelatedEntityId(postId);
        
        notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public Notification markAsRead(String notificationId) {
        return notificationRepository.findById(notificationId)
            .map(notification -> {
                notification.setRead(true);
                return notificationRepository.save(notification);
            })
            .orElseThrow(() -> new RuntimeException("Notification not found"));
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }
}