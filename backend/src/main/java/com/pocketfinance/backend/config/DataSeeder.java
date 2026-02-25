package com.pocketfinance.backend.config;

import com.pocketfinance.backend.domain.model.Category;
import com.pocketfinance.backend.domain.model.User;
import com.pocketfinance.backend.domain.repository.CategoryRepository;
import com.pocketfinance.backend.domain.repository.UserRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seed(UserRepository userRepository,
                           CategoryRepository categoryRepository,
                           PasswordEncoder passwordEncoder) {
        return args -> {
            User user = userRepository.findByEmailIgnoreCase("demo@pocket.local")
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setEmail("demo@pocket.local");
                        newUser.setFullName("Demo User");
                        newUser.setPasswordHash(passwordEncoder.encode("demo123"));
                        return userRepository.save(newUser);
                    });

            if (categoryRepository.findByUserIdOrderByNameAsc(user.getId()).isEmpty()) {
                List<Category> defaults = List.of(
                        createCategory(user, "Moradia", "#1B998B"),
                        createCategory(user, "Transporte", "#FF9F1C"),
                        createCategory(user, "Alimentacao", "#E71D36"),
                        createCategory(user, "Salario", "#2E86AB")
                );
                categoryRepository.saveAll(defaults);
            }
        };
    }

    private static Category createCategory(User user, String name, String color) {
        Category category = new Category();
        category.setUser(user);
        category.setName(name);
        category.setColor(color);
        return category;
    }
}
