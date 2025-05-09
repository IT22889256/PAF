// LearningPlanController.java
package com.paf.server.controller;

import com.paf.server.model.LearningPlan;
import com.paf.server.service.LearningPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learning-plans")
public class LearningPlanController {

    @Autowired
    private LearningPlanService learningPlanService;

    @GetMapping
    public ResponseEntity<List<LearningPlan>> getUserPlans(@AuthenticationPrincipal OAuth2User principal) {
        String userId = (String) principal.getAttribute("sub"); // Changed from email to sub (user ID)
        return ResponseEntity.ok(learningPlanService.getUserPlans(userId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<LearningPlan>> getUserPlans(@PathVariable String userId) {
        return ResponseEntity.ok(learningPlanService.getUserPlans(userId));
    }

    @PostMapping
    public ResponseEntity<LearningPlan> createPlan(
            @RequestBody LearningPlan plan,
            @AuthenticationPrincipal OAuth2User principal) {
        String userId = (String) principal.getAttribute("email");
        return ResponseEntity.ok(learningPlanService.createPlan(plan, userId));
    }

    @PutMapping("/{planId}")
    public ResponseEntity<LearningPlan> updatePlan(
            @PathVariable String planId,
            @RequestBody LearningPlan planUpdates,
            @AuthenticationPrincipal OAuth2User principal) {
        String userId = (String) principal.getAttribute("email");
        return ResponseEntity.ok(learningPlanService.updatePlan(planId, planUpdates, userId));
    }

    @GetMapping("/{planId}")
    public ResponseEntity<LearningPlan> getPlan(
            @PathVariable String planId,
            @AuthenticationPrincipal OAuth2User principal) {
        String userId = (String) principal.getAttribute("email");
        return ResponseEntity.ok(learningPlanService.getPlanAndValidateOwnership(planId, userId));
    }

    @DeleteMapping("/{planId}")
    public ResponseEntity<Void> deletePlan(
            @PathVariable String planId,
            @AuthenticationPrincipal OAuth2User principal) {
        String userId = (String) principal.getAttribute("email");
        learningPlanService.deletePlan(planId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{planId}/topics")
    public ResponseEntity<LearningPlan> addTopic(
            @PathVariable String planId,
            @RequestBody LearningPlan.PlanTopic topic,
            @AuthenticationPrincipal OAuth2User principal) {
        String userId = (String) principal.getAttribute("email");
        return ResponseEntity.ok(learningPlanService.addTopic(planId, topic, userId));
    }

    @PutMapping("/{planId}/topics/{topicId}/complete")
    public ResponseEntity<LearningPlan> markTopicComplete(
            @PathVariable String planId,
            @PathVariable String topicId,
            @AuthenticationPrincipal OAuth2User principal) {
        String userId = (String) principal.getAttribute("email");
        return ResponseEntity.ok(learningPlanService.markTopicComplete(planId, topicId, userId));
    }
}