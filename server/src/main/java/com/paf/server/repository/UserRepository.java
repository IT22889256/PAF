package com.paf.server.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.paf.server.model.User;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
}