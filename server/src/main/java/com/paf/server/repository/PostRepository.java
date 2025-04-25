package com.paf.server.repository;

import com.paf.server.model.Post;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findByUserId(String userId);
    List<Post> findBySkillCategory(String skillCategory);
    List<Post> findByTagsIn(List<String> tags);
}