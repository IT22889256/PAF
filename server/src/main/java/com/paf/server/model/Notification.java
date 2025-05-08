// src/main/java/com/paf/server/model/Notification.java
package com.paf.server.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String recipientId;
    private String senderId;
    private NotificationType type;
    private String content;
    private String relatedEntityId; // postId or commentId
    private boolean read = false;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum NotificationType {
        POST_LIKE,
        COMMENT_LIKE,
        NEW_COMMENT,
        NEW_FOLLOWER
    }
}