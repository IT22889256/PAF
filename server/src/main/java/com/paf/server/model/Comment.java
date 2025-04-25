// src/main/java/com/paf/server/model/Comment.java
package com.paf.server.model;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class Comment {
    private String id;
    private String userId;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> likes = new ArrayList<>();
}