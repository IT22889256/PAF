package com.paf.server.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.StorageClient;
import com.paf.server.config.FileStorageProperties;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api")
public class FileUploadController {
    
    private static final Logger logger = LoggerFactory.getLogger(FileUploadController.class);
    
    private final StorageClient storageClient;
    private final String bucketName;
    
    public FileUploadController(FileStorageProperties fileStorageProperties) {
        try {
            this.bucketName = fileStorageProperties.getBucketName();
            if (bucketName == null || bucketName.isEmpty()) {
                throw new IllegalArgumentException("Bucket name is not specified in FileStorageProperties");
            }
            this.storageClient = StorageClient.getInstance(FirebaseApp.getInstance());
            logger.info("FileUploadController initialized with bucket: {}", bucketName);
        } catch (IllegalStateException ex) {
            logger.error("FirebaseApp not initialized: {}", ex.getMessage(), ex);
            throw new RuntimeException("FirebaseApp not initialized", ex);
        }
    }
    
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                logger.warn("Upload attempt with empty file");
                return ResponseEntity.badRequest().body("Please select a file to upload");
            }
            
            // Validate file type (only images)
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                logger.warn("Upload attempt with non-image file: {}", contentType);
                return ResponseEntity.badRequest().body("Only image files are allowed");
            }
            
            // Generate unique filename
            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            
            // Upload file to Firebase Storage
            logger.info("Uploading file: {} to bucket: {}", filename, bucketName);
            storageClient.bucket(bucketName).create(filename, file.getBytes(), contentType);
            
            // Generate signed URL (valid for 7 days)
            String fileUrl = storageClient.bucket(bucketName)
                .get(filename)
                .signUrl(7, TimeUnit.DAYS)
                .toString();
            
            logger.info("File uploaded successfully, signed URL: {}", fileUrl);
            return ResponseEntity.ok(Map.of("fileUrl", fileUrl));
            
        } catch (IOException ex) {
            logger.error("Failed to upload file: {}", ex.getMessage(), ex);
            return ResponseEntity.internalServerError().body("Failed to upload file: " + ex.getMessage());
        }
    }
    
    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<?> serveFile(
            @PathVariable String filename,
            HttpServletRequest request) {
        try {
            // Get file from Firebase Storage
            com.google.cloud.storage.Blob blob = storageClient.bucket(bucketName).get(filename);
            
            if (blob == null || !blob.exists()) {
                logger.warn("File not found: {}", filename);
                return ResponseEntity.notFound().build();
            }
            
            // Generate signed URL (valid for 7 days)
            String fileUrl = blob.signUrl(7, TimeUnit.DAYS).toString();
            
            logger.info("Retrieved signed URL for file: {}", filename);
            return ResponseEntity.ok(Map.of("fileUrl", fileUrl));
            
        } catch (Exception ex) {
            logger.error("Failed to retrieve file: {}", ex.getMessage(), ex);
            return ResponseEntity.internalServerError().body("Failed to retrieve file: " + ex.getMessage());
        }
    }
}