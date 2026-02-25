package com.pocketfinance.backend.security;

import com.pocketfinance.backend.config.JwtProperties;
import com.pocketfinance.backend.domain.model.User;
import com.pocketfinance.backend.exception.UnauthorizedException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final String CLAIM_TYPE = "type";

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.secretKey = buildKey(jwtProperties.secret());
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(jwtProperties.issuer())
                .subject(user.getId().toString())
                .claim(CLAIM_TYPE, "access")
                .claim("email", user.getEmail())
                .claim("name", user.getFullName())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(jwtProperties.accessTokenMinutes(), ChronoUnit.MINUTES)))
                .signWith(secretKey)
                .compact();
    }

    public String generateRefreshToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(jwtProperties.issuer())
                .subject(user.getId().toString())
                .claim(CLAIM_TYPE, "refresh")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(jwtProperties.refreshTokenDays(), ChronoUnit.DAYS)))
                .signWith(secretKey)
                .compact();
    }

    public AppUserPrincipal parseAccessToken(String token) {
        Claims claims = parseClaims(token);
        if (!"access".equals(claims.get(CLAIM_TYPE, String.class))) {
            throw new UnauthorizedException("Token de acesso invalido.");
        }

        UUID userId = parseUserId(claims.getSubject());
        String email = claims.get("email", String.class);
        String fullName = claims.get("name", String.class);
        return new AppUserPrincipal(userId, email == null ? "" : email, fullName == null ? "" : fullName);
    }

    public UUID parseRefreshToken(String token) {
        Claims claims = parseClaims(token);
        if (!"refresh".equals(claims.get(CLAIM_TYPE, String.class))) {
            throw new UnauthorizedException("Refresh token invalido.");
        }
        return parseUserId(claims.getSubject());
    }

    public Instant refreshExpiration(String refreshToken) {
        return parseClaims(refreshToken).getExpiration().toInstant();
    }

    private Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(secretKey)
                    .requireIssuer(jwtProperties.issuer())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException ex) {
            throw new UnauthorizedException("Token invalido ou expirado.");
        }
    }

    private static UUID parseUserId(String subject) {
        try {
            return UUID.fromString(subject);
        } catch (IllegalArgumentException ex) {
            throw new UnauthorizedException("Token invalido.");
        }
    }

    private static SecretKey buildKey(String secret) {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (IllegalArgumentException ex) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("JWT secret deve possuir pelo menos 32 bytes.");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
