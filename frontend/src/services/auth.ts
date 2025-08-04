import axios from 'axios';
import type { LoginCredentials, SignupData, User } from '../types';
import { logAxiosError } from '../utils/errorLogger';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = AuthService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;

      try {
        const authResponse = await AuthService.refreshToken();
        AuthService.setToken(authResponse.access_token);
        return api(originalRequest);
      } catch (e) {
        logAxiosError(e, 'failed to refresh tokens');
        AuthService.removeToken();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export class AuthService {
  private static currentToken: string | null = null;

  static setToken(token: string | null) {
    this.currentToken = token;
  }

  static getToken() {
    return this.currentToken;
  }

  static removeToken() {
    this.currentToken = null;
  }

  static async login(credentials: LoginCredentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      logAxiosError(error, 'login');
      throw error;
    }
  }

  static async refreshToken() {
    try {
      const response = await api.post('/auth/refresh');
      return response.data;
    } catch (error) {
      logAxiosError(error, 'refresh token');
      throw error;
    }
  }

  static async initializeAuth() {
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

  static async getCurrentUser(): Promise<User> {
    try {
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
