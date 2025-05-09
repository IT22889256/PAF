package com.paf.server.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ConfigurationProperties(prefix = "firebase")
@Validated
public class FileStorageProperties {
    
    private static final Logger logger = LoggerFactory.getLogger(FileStorageProperties.class);
    
    @NotBlank
    private String bucketName;
    private String serviceAccount;

    public FileStorageProperties() {
        logger.info("FileStorageProperties instantiated");
    }

    public String getBucketName() {
        logger.debug("Retrieving bucketName: {}", bucketName);
        return bucketName;
    }

    public void setBucketName(String bucketName) {
        logger.info("Setting bucketName: {}", bucketName);
        this.bucketName = bucketName;
    }

    public String getServiceAccount() {
        logger.debug("Retrieving serviceAccount: {}", serviceAccount);
        return serviceAccount;
    }

    public void setServiceAccount(String serviceAccount) {
        logger.info("Setting serviceAccount: {}", serviceAccount);
        this.serviceAccount = serviceAccount;
    }
}