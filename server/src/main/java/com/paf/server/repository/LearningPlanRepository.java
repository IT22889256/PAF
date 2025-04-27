// LearningPlanRepository.java
package com.paf.server.repository;

import com.paf.server.model.LearningPlan;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface LearningPlanRepository extends MongoRepository<LearningPlan, String> {
    List<LearningPlan> findByUserId(String userId);

    List<LearningPlan> findByUserIdAndSkillCategory(String userId, String skillCategory);
}