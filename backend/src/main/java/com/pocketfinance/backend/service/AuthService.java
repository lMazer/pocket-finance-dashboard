package com.pocketfinance.backend.service;

import com.pocketfinance.backend.api.dto.AuthLoginRequest;
import com.pocketfinance.backend.api.dto.AuthResponse;
import com.pocketfinance.backend.api.dto.AuthUserResponse;
import com.pocketfinance.backend.api.dto.MeResponse;
import com.pocketfinance.backend.api.dto.RefreshTokenRequest;
import com.pocketfinance.backend.config.JwtProperties;
import com.pocketfinance.backend.domain.model.User;
import com.pocketfinance.backend.domain.repository.UserRepository;
import com.pocketfinance.backend.exception.UnauthorizedException;
import com.pocketfinance.backend.security.JwtService;
import com.pocketfinance.backend.security.TokenHashService;
import java.time.Instant;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenHashService tokenHashService;
    private final JwtProperties jwtProperties;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       TokenHashService tokenHashService,
                       JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.tokenHashService = tokenHashService;
        this.jwtProperties = jwtProperties;
    }

    public AuthResponse login(AuthLoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new UnauthorizedException("Credenciais invalidas."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Credenciais invalidas.");
        }

        return issueTokens(user);
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        UUID userId = jwtService.parseRefreshToken(request.refreshToken());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Refresh token invalido."));

        if (user.getRefreshTokenHash() == null || user.getRefreshTokenExpiresAt() == null) {
            throw new UnauthorizedException("Sessao nao encontrada.");
        }

        if (Instant.now().isAfter(user.getRefreshTokenExpiresAt())) {
            throw new UnauthorizedException("Refresh token expirado.");
        }

        if (!tokenHashService.matches(request.refreshToken(), user.getRefreshTokenHash())) {
            throw new UnauthorizedException("Refresh token invalido.");
        }

        return issueTokens(user);
    }

    public void logout(UUID userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setRefreshTokenHash(null);
            user.setRefreshTokenExpiresAt(null);
            userRepository.save(user);
        });
    }

    @Transactional(readOnly = true)
    public MeResponse me(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Usuario nao encontrado."));
        return new MeResponse(user.getId(), user.getEmail(), user.getFullName());
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        user.setRefreshTokenHash(tokenHashService.hash(refreshToken));
        user.setRefreshTokenExpiresAt(jwtService.refreshExpiration(refreshToken));
        userRepository.save(user);

        return new AuthResponse(
                "Bearer",
                accessToken,
                refreshToken,
                jwtProperties.accessTokenMinutes() * 60,
                new AuthUserResponse(user.getId(), user.getEmail(), user.getFullName())
        );
    }
}
