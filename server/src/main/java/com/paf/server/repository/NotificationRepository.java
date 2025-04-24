// src/main/java/com/paf/server/repository/NotificationRepository.java
package com.paf.server.repository;

import com.paf.server.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);
    List<Notification> findByRecipientIdAndReadFalseOrderByCreatedAtDesc(String recipientId);
    long countByRecipientIdAndReadFalse(String recipientId);
    void deleteByRelatedEntityId(String relatedEntityId);
}