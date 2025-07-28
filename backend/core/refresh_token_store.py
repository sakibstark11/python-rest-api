from typing import Dict, Optional


class RefreshTokenStore:
    def __init__(self):
        # Maps user_id to refresh_token
        self._user_refresh_tokens: Dict[str, str] = {}

    def store_token(self, user_id: str, refresh_token: str):
        """Store refresh token for a user"""
        self._user_refresh_tokens[user_id] = refresh_token

    def get_token(self, user_id: str) -> Optional[str]:
        """Get refresh token for a user"""
        return self._user_refresh_tokens.get(user_id)

    def revoke_token(self, user_id: str):
        """Revoke refresh token for a user"""
        self._user_refresh_tokens.pop(user_id, None)

    def is_token_valid(self, user_id: str, refresh_token: str) -> bool:
        """Check if the provided refresh token matches the stored one for the user"""
        stored_token = self.get_token(user_id)
        return stored_token is not None and stored_token == refresh_token


refresh_token_store = RefreshTokenStore()
