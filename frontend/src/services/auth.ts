import axios from 'axios';
import type { AuthResponse, LoginCredentials, SignupData, User } from '../types';
import { logAxiosError } from '../utils/errorLogger';

class TokenManager {
  private currentToken: string | null = null;

  setToken(token: string | null) {
    this.currentToken = token;
  }

  getToken(): string | null {
    return this.currentToken;
  }

  removeToken() {
    this.currentToken = null;
  }
}

const tokenManager = new TokenManager();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    return Promise.reject(error);
  },
);

export class AuthService {
  static setToken(token: string | null) {
    tokenManager.setToken(token);
  }

  static getToken(): string | null {
    return tokenManager.getToken();
  }

  static removeToken() {
    tokenManager.removeToken();
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      logAxiosError(error, 'login');
      throw error;
    }
  }

  static async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/refresh');
      return response.data;
    } catch (error) {
      logAxiosError(error, 'refresh token');
      throw error;
    }
  }

  static async initializeAuth(): Promise<{ user: User; accessToken: string } | null> {
    try {
      const authResponse = await this.refreshToken();
      this.setToken(authResponse.access_token);
      const user = await this.getCurrentUser();
      return {
        user,
        accessToken: authResponse.access_token,
      };
    } catch (error) {
      logAxiosError(error, 'initialize auth');
      return null;
    }
  }

  static async signup(userData: SignupData): Promise<User> {
    try {
      const response = await axios.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      logAxiosError(error, 'signup');
      throw error;
    }
  }

  static async getCurrentUser(token?: string): Promise<User> {
    try {
      if (token) {
        this.setToken(token);
      }

      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      logAxiosError(error, 'get current user');
      throw error;
    }
  }

  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      logAxiosError(error, 'logout');
    }
  }

  static isTokenValid(token: string): boolean {
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      return !isExpired;
    } catch {
      return false;
    }
  }

  static getApi() {
    return api;
  }
}
