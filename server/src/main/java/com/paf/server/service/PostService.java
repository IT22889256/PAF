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

    public Post updatePost(String id, Post postUpdates, String userId) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isEmpty()) {
            throw new RuntimeException("Post not found");
        }

        Post post = postOpt.get();
        if (!post.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to update this post");
        }

        if (postUpdates.getContent() != null) {
            post.setContent(postUpdates.getContent());
        }
        if (postUpdates.getTags() != null) {
            post.setTags(postUpdates.getTags());
        }
        if (postUpdates.getSkillCategory() != null) {
            post.setSkillCategory(postUpdates.getSkillCategory());
        }
        post.setUpdatedAt(LocalDateTime.now());

        return postRepository.save(post);
    }

    public void deletePost(String id, String userId) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isEmpty()) {
            throw new RuntimeException("Post not found");
        }

        Post post = postOpt.get();
        if (!post.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this post");
        }

        postRepository.deleteById(id);
    }

    public Post likePost(String postId, String userId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        if (!post.getLikes().contains(userId)) {
            post.getLikes().add(userId);
            Post updatedPost = postRepository.save(post);
            
            // Create notification
            notificationService.createPostLikeNotification(postId, userId, post.getUserId());
            
            return updatedPost;
        }
        return post;
    }

    public Post unlikePost(String postId, String userId) {
        Optional<Post> postOpt = postRepository.findById(postId);
        if (postOpt.isEmpty()) {
            throw new RuntimeException("Post not found");
        }

        Post post = postOpt.get();
        post.getLikes().remove(userId);
        return postRepository.save(post);
    }

    public Post addComment(String postId, Comment comment, String userId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        comment.setId(UUID.randomUUID().toString());
        comment.setUserId(userId);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        
        post.getComments().add(comment);
        Post updatedPost = postRepository.save(post);
        
        // Create notification
        notificationService.createNewCommentNotification(
            postId, 
            userId, 
            post.getUserId(), 
            comment.getContent()
        );
        
        return updatedPost;
    }

    public Post deleteComment(String postId, String commentId, String userId) {
        Optional<Post> postOpt = postRepository.findById(postId);
        if (postOpt.isEmpty()) {
            throw new RuntimeException("Post not found");
        }

        Post post = postOpt.get();
        Optional<Comment> commentOpt = post.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst();

        if (commentOpt.isEmpty()) {
            throw new RuntimeException("Comment not found");
        }

        Comment comment = commentOpt.get();
        if (!comment.getUserId().equals(userId) && !post.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this comment");
        }

        post.getComments().removeIf(c -> c.getId().equals(commentId));
        return postRepository.save(post);
    }
    public Post likeComment(String postId, String commentId, String userId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        Comment comment = post.getComments().stream()
            .filter(c -> c.getId().equals(commentId))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        if (!comment.getLikes().contains(userId)) {
            comment.getLikes().add(userId);
            Post updatedPost = postRepository.save(post);
            
            // Create notification
            notificationService.createCommentLikeNotification(
                commentId, 
                userId, 
                comment.getUserId(), 
                postId
            );
            
            return updatedPost;
        }
        return post;
    }
}
