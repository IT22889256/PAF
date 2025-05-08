package com.paf.server.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.StorageClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);
    
    private final FileStorageProperties fileStorageProperties;
    
    public FirebaseConfig(FileStorageProperties fileStorageProperties) {
        this.fileStorageProperties = fileStorageProperties;
    }
    
    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                // Load service account file
                Resource resource = new ClassPathResource(fileStorageProperties.getServiceAccount());
                if (!resource.exists()) {
                    throw new IOException("Service account file not found: " + 
                        fileStorageProperties.getServiceAccount());
                }
                
                // Initialize Firebase
                InputStream serviceAccount = resource.getInputStream();
                FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setStorageBucket(fileStorageProperties.getBucketName())
                    .build();
                
                FirebaseApp.initializeApp(options);
                logger.info("Firebase initialized successfully");
                
                // Verify storage access
                StorageClient.getInstance()
                    .bucket(fileStorageProperties.getBucketName())
                    .list();
                logger.info("Firebase Storage connection verified");
            }
        } catch (IOException e) {
            logger.error("Firebase initialization failed", e);
            throw new RuntimeException("Failed to initialize Firebase", e);
        }
    }
}