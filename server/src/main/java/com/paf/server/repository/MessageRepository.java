package com.paf.server.repository;

import com.paf.server.model.CommunityMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface MessageRepository extends MongoRepository<CommunityMessage, String> {
    List<CommunityMessage> findByCommunityIdOrderByTimestampAsc(String communityId);
    
    List<CommunityMessage> findByCommunityIdAndReadFalseAndSenderIdNot(
        String communityId, String senderId);
    
    long countByCommunityIdAndReadFalseAndSenderIdNot(
        String communityId, String senderId);
}