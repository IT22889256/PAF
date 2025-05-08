package com.paf.server.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "communities")
@Data
public class Community {
    @Id
    private String id;
    private String name;
    private String description;
    private String ownerId;
    private boolean isPrivate;
    private List<String> members = new ArrayList<>();
    private List<String> tags = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Optional: for tracking last message
    private String lastMessagePreview;
    private LocalDateTime lastMessageTime;
}