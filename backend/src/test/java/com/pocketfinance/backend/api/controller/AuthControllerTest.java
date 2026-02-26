package com.pocketfinance.backend.api.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pocketfinance.backend.api.dto.AuthLoginRequest;
import com.pocketfinance.backend.api.dto.AuthResponse;
import com.pocketfinance.backend.api.dto.AuthUserResponse;
import com.pocketfinance.backend.api.dto.MeResponse;
import com.pocketfinance.backend.api.dto.RefreshTokenRequest;
import com.pocketfinance.backend.security.AppUserPrincipal;
import com.pocketfinance.backend.service.AuthService;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    private AuthController controller;
    private UUID userId;
    private AppUserPrincipal principal;

    @BeforeEach
    void setUp() {
        controller = new AuthController(authService);
        userId = UUID.randomUUID();
        principal = new AppUserPrincipal(userId, "demo@pocket.local", "Demo User");
    }

    @Test
    void loginAndRefreshShouldDelegateToService() {
        AuthLoginRequest loginRequest = new AuthLoginRequest("demo@pocket.local", "demo123");
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest("refresh-token");
        AuthResponse authResponse = new AuthResponse(
                "Bearer",
                "access-token",
                "refresh-token",
                900,
                new AuthUserResponse(userId, "demo@pocket.local", "Demo User")
        );

        when(authService.login(loginRequest)).thenReturn(authResponse);
        when(authService.refresh(refreshRequest)).thenReturn(authResponse);

        assertEquals(authResponse, controller.login(loginRequest));
        assertEquals(authResponse, controller.refresh(refreshRequest));
        verify(authService).login(loginRequest);
        verify(authService).refresh(refreshRequest);
    }

    @Test
    void logoutAndMeShouldDelegateUsingPrincipalUserId() {
        MeResponse me = new MeResponse(userId, "demo@pocket.local", "Demo User");
        when(authService.me(userId)).thenReturn(me);

        controller.logout(principal);
        verify(authService).logout(userId);

        MeResponse response = controller.me(principal);
        assertEquals(me, response);
        verify(authService).me(userId);
    }
}
