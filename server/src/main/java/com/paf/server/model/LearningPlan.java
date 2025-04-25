// LearningPlan.java model
package com.paf.server.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "learning_plans")
@Data
public class LearningPlan {
    @Id
    private String id;
    private String userId;
    private String title;
    private String description;
    private String skillCategory;
    private int progress = 0;
    private List<PlanTopic> topics;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class PlanTopic {
        private String id;
        private String title;
        private String description;
        private List<String> resources; // URLs or references
        private boolean completed;
        private LocalDateTime completedAt;
    }
}