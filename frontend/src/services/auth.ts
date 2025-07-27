import axios from 'axios';
import type { AuthResponse, LoginCredentials, SignupData, User } from '../types';

const API_BASE_URL = 'http://localhost:8000/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage utilities
class TokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static hasValidTokens(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (!accessToken || !refreshToken) return false;

    try {
      // Basic check for JWT structure
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      return !isExpired;
    } catch {
      return false;
    }
  }
}

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = TokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = TokenStorage.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;
          TokenStorage.setTokens(access_token, newRefreshToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch {
        TokenStorage.clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const authData = response.data;
    TokenStorage.setTokens(authData.access_token, authData.refresh_token);

    return authData;
  }

  static async signup(userData: SignupData): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    return response.data;
  }

  static async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  }

  static logout(): void {
    TokenStorage.clearTokens();
  }

  static isAuthenticated(): boolean {
    return TokenStorage.hasValidTokens();
  }

  static getApi() {
    return api;
  }
}

export { TokenStorage };
