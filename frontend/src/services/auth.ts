import axios from 'axios';
import type { AuthResponse, LoginCredentials, SignupData, User } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});


api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    return Promise.reject(error);
  }
);

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  }

  static async refreshToken(): Promise<AuthResponse> {
    const response = await api.post('/auth/refresh');
    return response.data;
  }

  static async initializeAuth(): Promise<{ user: User; accessToken: string } | null> {
    try {
      const authResponse = await this.refreshToken();
      const user = await this.getCurrentUser(authResponse.access_token);
      return {
        user,
        accessToken: authResponse.access_token,
      };
    } catch (error) {
      return null;
    }
  }

  static async signup(userData: SignupData): Promise<User> {
    const response = await axios.post('/auth/register', userData);
    return response.data;
  }

  static async getCurrentUser(token: string): Promise<User> {
    const response = await api.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static logout(): void {
    // Token cleanup will be handled by the context
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
