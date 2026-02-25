export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface MeResponse {
  id: string;
  email: string;
  fullName: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface AuthSession {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}
