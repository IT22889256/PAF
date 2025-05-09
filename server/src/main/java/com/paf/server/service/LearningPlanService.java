package com.paf.server.service;

import com.paf.server.model.LearningPlan;
import com.paf.server.model.User;
import com.paf.server.repository.LearningPlanRepository;
import com.paf.server.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class LearningPlanService {

    private final LearningPlanRepository learningPlanRepository;
    private final UserRepository userRepository;

    @Autowired
    public LearningPlanService(LearningPlanRepository learningPlanRepository,
            UserRepository userRepository) {
        this.learningPlanRepository = learningPlanRepository;
        this.userRepository = userRepository;
    }

    public List<LearningPlan> getUserPlans(String userId) {
        log.debug("Fetching learning plans for user with ID: {}", userId);
        validateUserById(userId); // Changed from email validation to ID validation
        return learningPlanRepository.findByUserId(userId);
    }

    public LearningPlan createPlan(LearningPlan plan, String userEmail) {
        log.debug("Creating new learning plan for user with email: {}", userEmail);
        User user = validateUserByEmail(userEmail);

        plan.setId(UUID.randomUUID().toString());
        plan.setUserId(user.getId());
        plan.setCreatedAt(LocalDateTime.now());
        plan.setUpdatedAt(LocalDateTime.now());
        updatePlanProgress(plan);

        LearningPlan savedPlan = learningPlanRepository.save(plan);
        log.info("Created new learning plan with ID: {}", savedPlan.getId());
        return savedPlan;
    }

    // ... rest of the service methods remain the same ...

    private User validateUserById(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }
        Optional<User> userOptional = userRepository.findById(userId);
        return userOptional.orElseThrow(() -> new RuntimeException("User with ID " + userId + " not found"));
    }

    // Keep the existing validateUserByEmail method for other operations
    private User validateUserByEmail(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new IllegalArgumentException("User email cannot be null or empty");
        }
        Optional<User> userOptional = userRepository.findByEmail(userEmail);
        return userOptional.orElseThrow(() -> new RuntimeException("User with email " + userEmail + " not found"));
    }

    public LearningPlan updatePlan(String planId, LearningPlan planUpdates, String userEmail) {
        log.debug("Updating learning plan: {} for user with email: {}", planId, userEmail);
        User user = validateUserByEmail(userEmail);
        LearningPlan existingPlan = getPlanAndValidateOwnership(planId, user.getId());

        // Update fields if they are provided
        if (planUpdates.getTitle() != null) {
            existingPlan.setTitle(planUpdates.getTitle());
        }
        if (planUpdates.getDescription() != null) {
            existingPlan.setDescription(planUpdates.getDescription());
        }
        if (planUpdates.getSkillCategory() != null) {
            existingPlan.setSkillCategory(planUpdates.getSkillCategory());
        }
        if (planUpdates.getTopics() != null) {
            existingPlan.setTopics(planUpdates.getTopics());
        }

        updatePlanProgress(existingPlan);
        existingPlan.setUpdatedAt(LocalDateTime.now());

        LearningPlan updatedPlan = learningPlanRepository.save(existingPlan);
        log.info("Updated learning plan with ID: {}", planId);
        return updatedPlan;
    }

    public void deletePlan(String planId, String userEmail) {
        log.debug("Deleting learning plan: {} for user with email: {}", planId, userEmail);
        User user = validateUserByEmail(userEmail);
        LearningPlan plan = getPlanAndValidateOwnership(planId, user.getId());
        learningPlanRepository.deleteById(planId);
        log.info("Deleted learning plan with ID: {}", planId);
    }

    public LearningPlan addTopic(String planId, LearningPlan.PlanTopic topic, String userEmail) {
        log.debug("Adding topic to learning plan: {} for user with email: {}", planId, userEmail);
        User user = validateUserByEmail(userEmail);
        LearningPlan plan = getPlanAndValidateOwnership(planId, user.getId());

        topic.setId(UUID.randomUUID().toString());
        topic.setCompleted(false);
        topic.setCompletedAt(LocalDateTime.now());

        plan.getTopics().add(topic);
        updatePlanProgress(plan);
        plan.setUpdatedAt(LocalDateTime.now());

        LearningPlan updatedPlan = learningPlanRepository.save(plan);
        log.info("Added new topic to plan ID: {}", planId);
        return updatedPlan;
    }

    public LearningPlan markTopicComplete(String planId, String topicId, String userEmail) {
        log.debug("Marking topic {} complete in plan: {} for user with email: {}", topicId, planId, userEmail);
        User user = validateUserByEmail(userEmail);
        LearningPlan plan = getPlanAndValidateOwnership(planId, user.getId());

        plan.getTopics().stream()
                .filter(t -> t.getId().equals(topicId))
                .findFirst()
                .ifPresentOrElse(
                        topic -> {
                            topic.setCompleted(true);
                            topic.setCompletedAt(LocalDateTime.now());
                        },
                        () -> {
                            throw new RuntimeException("Topic with ID " + topicId + " not found in plan");
                        });

        updatePlanProgress(plan);
        plan.setUpdatedAt(LocalDateTime.now());

        LearningPlan updatedPlan = learningPlanRepository.save(plan);
        log.info("Marked topic {} complete in plan ID: {}", topicId, planId);
        return updatedPlan;
    }

    private void updatePlanProgress(LearningPlan plan) {
        if (plan.getTopics() == null || plan.getTopics().isEmpty()) {
            plan.setProgress(0);
            return;
        }

        long completedCount = plan.getTopics().stream()
                .filter(LearningPlan.PlanTopic::isCompleted)
                .count();

        int progress = (int) ((completedCount * 100) / plan.getTopics().size());
        plan.setProgress(progress);
    }

    public LearningPlan getPlanAndValidateOwnership(String planId, String userId) {
        LearningPlan plan = learningPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Learning plan with ID " + planId + " not found"));

        if (!plan.getUserId().equals(userId)) {
            throw new RuntimeException("User with ID " + userId + " is not authorized to access plan " + planId);
        }

        return plan;
    }

    public LearningPlan getPlanById(String planId, String userEmail) {
        User user = validateUserByEmail(userEmail);
        return getPlanAndValidateOwnership(planId, user.getId());
    }
}