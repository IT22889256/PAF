package com.paf.server;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import com.paf.server.config.FileStorageProperties;

import io.jsonwebtoken.io.IOException;

import java.nio.file.Files;
import java.nio.file.Paths;

// @SpringBootApplication
// public class ServerApplication {

//     @Value("${file.upload-dir}")
//     private String uploadDir;

//     public static void main(String[] args) {
//         SpringApplication.run(ServerApplication.class, args);
//     }

//     @EventListener(ApplicationReadyEvent.class)
//     public void createUploadDir() throws IOException, java.io.IOException {
//         Files.createDirectories(Paths.get(uploadDir));
//     }
// }

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({
    FileStorageProperties.class
})
public class ServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServerApplication.class, args);
    }
}