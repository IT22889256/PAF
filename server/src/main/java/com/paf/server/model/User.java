package com.paf.server.model;


import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "users")
@Data
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    private String profilePicture;
    private String bio;
    private String location;
    private List<String> skills = new ArrayList<>();
    private List<String> interests = new ArrayList<>();
    private List<String> roles = new ArrayList<>();
    private List<String> communities = new ArrayList<>();
    private List<String> ownedCommunities = new ArrayList<>();
    private List<String> following = new ArrayList<>();
    private List<String> followers = new ArrayList<>();
    private List<String> postIds = new ArrayList<>();
    
}