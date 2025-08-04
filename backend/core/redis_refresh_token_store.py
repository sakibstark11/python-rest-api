from typing import Optional

import redis.asyncio as redis
from core.config import settings


class RedisRefreshTokenStore:
    def __init__(self):
        self.client = redis.Redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True
        )
        self.key_prefix = "refresh_token"
        self.ttl_seconds = settings.refresh_token_expire_days * \
            24 * 60 * 60

    def _get_key(self, user_id: str) -> str:
        """Generate Redis key for user's refresh token"""
        return f"{self.key_prefix}:{user_id}"

    async def store_token(self, user_id: str, refresh_token: str):
        """Store refresh token for a user with TTL"""
        key = self._get_key(user_id)
        await self.client.setex(key, self.ttl_seconds, refresh_token)

    async def get_token(self, user_id: str) -> Optional[str]:
        """Get refresh token for a user"""
        key = self._get_key(user_id)
        token = await self.client.get(key)
        return token

    async def revoke_token(self, user_id: str):
        """Revoke refresh token for a user"""
        key = self._get_key(user_id)
        await self.client.delete(key)

    async def is_token_valid(self, user_id: str, refresh_token: str) -> bool:
        """Check if the provided refresh token matches the stored one for the user"""
        stored_token = await self.get_token(user_id)
        return stored_token is not None and stored_token == refresh_token


redis_refresh_token_store = RedisRefreshTokenStore()
