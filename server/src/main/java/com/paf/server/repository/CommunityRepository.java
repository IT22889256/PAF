package com.paf.server.repository;

import com.paf.server.model.Community;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CommunityRepository extends MongoRepository<Community, String> {
    List<Community> findByOwnerId(String ownerId);
    List<Community> findByMembersContaining(String memberId);
    List<Community> findByIsPrivate(boolean isPrivate);
    
    // New methods for chat functionality
    List<Community> findByMembersContainingOrderByLastMessageTimeDesc(String memberId);
    boolean existsByIdAndMembersContaining(String communityId, String memberId);
}