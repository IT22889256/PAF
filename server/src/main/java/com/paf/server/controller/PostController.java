package com.paf.server.controller;

import com.paf.server.model.Post;
import com.paf.server.model.Comment;
import com.paf.server.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostService postService;

   @PostMapping
public ResponseEntity<?> createPost(
        @RequestBody Post post,
        @AuthenticationPrincipal OAuth2User principal) {
    try {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }

        String userEmail = principal.getAttribute("email");
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "User email not found in authentication"));
        }

        Post createdPost = postService.createPost(post, userEmail);
        return ResponseEntity.ok(createdPost);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to create post: " + e.getMessage()));
    }
}

    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        List<Post> posts = postService.getAllPosts();
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable String id) {
        return postService.getPostById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Post>> getPostsByUserId(@PathVariable String userId) {
        List<Post> posts = postService.getPostsByUserId(userId);
        return ResponseEntity.ok(posts);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Post> updatePost(
            @PathVariable String id,
            @RequestBody Post postUpdates,
            @AuthenticationPrincipal OAuth2User principal) {
        String userId = (String) principal.getAttribute("email");
        Post updatedPost = postService.updatePost(id, postUpdates, userId);
        return ResponseEntity.ok(updatedPost);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal) {
        String userId = (String) principal.getAttribute("email");
        postService.deletePost(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Post> likePost(
            @PathVariable String postId,
            @AuthenticationPrincipal OAuth2User principal) {
        String userId = (String) principal.getAttribute("email");
        Post post = postService.likePost(postId, userId);
        return ResponseEntity.ok(post);
    }

    @PostMapping("/{postId}/unlike")
    public ResponseEntity<Post> unlikePost(
            @PathVariable String postId,
            @AuthenticationPrincipal OAuth2User principal) {
        String userId = (String) principal.getAttribute("email");
        Post post = postService.unlikePost(postId, userId);
        return ResponseEntity.ok(post);
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<Post> addComment(
            @PathVariable String postId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal OAuth2User principal) {
        String userId = (String) principal.getAttribute("email");
        Comment comment = new Comment();
        comment.setContent(request.get("content"));
        Post post = postService.addComment(postId, comment, userId);
        return ResponseEntity.ok(post);
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<Post> deleteComment(
            @PathVariable String postId,
            @PathVariable String commentId,
            @AuthenticationPrincipal OAuth2User principal) {
        String userId = (String) principal.getAttribute("email");
        Post post = postService.deleteComment(postId, commentId, userId);
        return ResponseEntity.ok(post);
    }
}
