class TokenManager {
  private currentToken: string | null = null;

  setToken(token: string | null) {
    this.currentToken = token;
  }

  getToken(): string | null {
    return this.currentToken;
  }
}

export const tokenManager = new TokenManager();