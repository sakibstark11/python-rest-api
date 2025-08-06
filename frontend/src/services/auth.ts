import axios, { type AxiosInstance } from 'axios';
import type { LoginCredentials, SignupData, User } from '../types';
import { logAxiosError } from '../utils/errorLogger';

class AuthService {
  private api: AxiosInstance;

  private currentToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.api.interceptors.request.use((config) => {
      const token = this.getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async(error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
          originalRequest._retry = true;

          try {
            const authResponse = await this.refreshToken();

            this.setToken(authResponse.access_token);

            return this.api(originalRequest);
          } catch (e) {
            logAxiosError(e, 'failed to refresh tokens');
            this.removeToken();

            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  getApi(): AxiosInstance {
    return this.api;
  }

  setToken(token: string | null) {
    this.currentToken = token;
  }

  getToken() {
    return this.currentToken;
  }

  removeToken() {
    this.currentToken = null;
  }

  async login(credentials: LoginCredentials) {
    try {
      const response = await this.api.post('/auth/login', credentials);

      return response.data;
    } catch (error) {
      logAxiosError(error, 'login');
      throw error;
    }
  }

  async refreshToken() {
    try {
      const response = await this.api.post('/auth/refresh');

      return response.data;
    } catch (error) {
      logAxiosError(error, 'refresh token');
      throw error;
    }
  }

  async initializeAuth() {
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

  async signup(userData: SignupData): Promise<User> {
    try {
      const response = await this.api.post('/auth/register', userData);

      return response.data;
    } catch (error) {
      logAxiosError(error, 'signup');
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get('/auth/me');

      return response.data;
    } catch (error) {
      logAxiosError(error, 'get current user');
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      logAxiosError(error, 'logout');
    }
  }

  isTokenValid(token: string): boolean {
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      return !isExpired;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
