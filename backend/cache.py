import json
import os
from typing import Any, Optional

from upstash_redis.asyncio import Redis

CACHE_KEY_LOCATIONS = "locations:v1"
CACHE_TTL_SECONDS = int(os.getenv("LOCATIONS_CACHE_TTL", "60"))

_redis: Optional[Redis] = None

def get_redis() -> Optional[Redis]:
    global _redis
    url = os.getenv("UPSTASH_REDIS_REST_URL")
    token = os.getenv("UPSTASH_REDIS_REST_TOKEN")
    if not url or not token:
        return None
    if _redis is None:
        _redis = Redis(url=url, token=token)
    return _redis

async def cache_get_json(key: str) -> Optional[Any]:
    r = get_redis()
    if not r:
        return None
    val = await r.get(key)
    if val is None:
        return None
    try:
        return json.loads(val)
    except Exception:
        return None

async def cache_set_json(key: str, obj: Any, ttl_seconds: int) -> None:
    r = get_redis()
    if not r:
        return
    await r.set(key, json.dumps(obj), ex=ttl_seconds)

async def invalidate_locations_cache() -> None:
    r = get_redis()
    if not r:
        return
    await r.delete(CACHE_KEY_LOCATIONS)
