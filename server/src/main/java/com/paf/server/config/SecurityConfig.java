package com.paf.server.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.paf.server.service.CustomOAuth2UserService;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
// public class SecurityConfig {
    
//     @Autowired
//     private CustomOAuth2UserService oauthUserService;

//     @Bean
//     public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
//         http
//             .cors().and()
//             .csrf().disable()
//             .oauth2Login(oauth -> oauth
//                 .userInfoEndpoint()
//                 .userService(oauthUserService)
//                 .and()
//                 .successHandler((request, response, authentication) -> {
//                     response.sendRedirect("http://localhost:5173");
//                 })
//             )
//             .oauth2Login(oauth -> oauth
//                 .userInfoEndpoint()
//                 .userService(oauthUserService)
//             );
        
//         return http.build();
//     }

    
    
//     @Bean
//     CorsConfigurationSource corsConfigurationSource() {
//         CorsConfiguration configuration = new CorsConfiguration();
//         configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
//         configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
//         configuration.setAllowedHeaders(Arrays.asList("*"));
//         configuration.setAllowCredentials(true);
//         UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//         source.registerCorsConfiguration("/**", configuration);
//         return source;
//     }
// }

public class SecurityConfig {
    
    @Autowired
    private CustomOAuth2UserService oauthUserService;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors().and()
            .csrf().disable()
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/login**", "/error**").permitAll()
                .requestMatchers("/api/notifications/**").authenticated() // Explicitly secure notifications
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth -> oauth
                .userInfoEndpoint()
                .userService(oauthUserService)
                .and()
                .successHandler((request, response, authentication) -> {
                    response.sendRedirect("http://localhost:5173");
                })
            )
            .logout(logout -> logout
                .logoutSuccessUrl("http://localhost:5173")
                .permitAll()
            );
        
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}