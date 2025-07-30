class TokenManager {
  private currentToken: string | null = null;

  setToken(token: string | null) {
    this.currentToken = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getToken(): string | null {
    if (!this.currentToken) {
      this.currentToken = localStorage.getItem('accessToken');
    }
    return this.currentToken;
  }

  removeToken() {
    this.currentToken = null;
    localStorage.removeItem('accessToken');
    localStorage.clear(); // Clear all localStorage data
    sessionStorage.clear(); // Clear all sessionStorage data
  }
}

export const tokenManager = new TokenManager();