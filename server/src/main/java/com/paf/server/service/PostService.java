package com.paf.server.service;

import com.paf.server.model.Comment;
import com.paf.server.model.Post;
import com.paf.server.model.User;
import com.paf.server.repository.PostRepository;
import com.paf.server.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    private final NotificationService notificationService;

    @Autowired
    public PostService(PostRepository postRepository, 
                      UserRepository userRepository,
                      NotificationService notificationService) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public Post createPost(Post post, String userEmail) {
    // Validate post content
    if (post.getContent() == null && (post.getMediaUrls() == null || post.getMediaUrls().isEmpty())) {
        throw new IllegalArgumentException("Post must have content or media");
    }

    // Find or create user
    User user = userRepository.findByEmail(userEmail)
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(userEmail);
                newUser.setName("New User"); // Default name
                return userRepository.save(newUser);
            });

    // Set post properties
    post.setUserId(user.getId());
    post.setCreatedAt(LocalDateTime.now());
    post.setUpdatedAt(LocalDateTime.now());

    // Save post
    Post savedPost = postRepository.save(post);

    // Update user's posts
    if (user.getPostIds() == null) {
        user.setPostIds(new ArrayList<>());
    }
    user.getPostIds().add(savedPost.getId());
    userRepository.save(user);

    return savedPost;
}

    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    public Optional<Post> getPostById(String id) {
        return postRepository.findById(id);
    }

    public List<Post> getPostsByUserId(String userId) {
        return postRepository.findByUserId(userId);
    }