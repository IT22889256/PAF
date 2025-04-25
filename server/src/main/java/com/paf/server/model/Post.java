// src/main/java/com/paf/server/model/Post.java
package com.paf.server.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "posts")
public class Post {
    @Id
    private String id;
    private String userId;
    private String content;
    private List<String> mediaUrls = new ArrayList<>();
    private List<String> tags = new ArrayList<>();
    private String skillCategory;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> likes = new ArrayList<>();
    private List<Comment> comments = new ArrayList<>();
}