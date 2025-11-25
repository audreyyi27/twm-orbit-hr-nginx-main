import redis.asyncio as redis
import json
import os
from typing import Optional, Any
from dotenv import load_dotenv

load_dotenv()

# Redis connection settings
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
CACHE_TTL = int(os.getenv('CACHE_TTL', '3600'))  # 1 hour default

# Redis connection pool
redis_pool = None

async def get_redis():
    """Get Redis connection"""
    global redis_pool
    if redis_pool is None:
        redis_pool = redis.ConnectionPool.from_url(REDIS_URL)
    return redis.Redis(connection_pool=redis_pool)

async def close_redis():
    """Close Redis connection"""
    global redis_pool
    if redis_pool:
        await redis_pool.disconnect()
        redis_pool = None

# Cache utility functions
async def cache_get(key: str) -> Optional[Any]:
    """Get value from cache"""
    try:
        redis_client = await get_redis()
        value = await redis_client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception as e:
        print(f"Cache get error: {e}")
        return None

async def cache_set(key: str, value: Any, ttl: int = CACHE_TTL) -> bool:
    """Set value in cache"""
    try:
        redis_client = await get_redis()
        await redis_client.setex(key, ttl, json.dumps(value, default=str))
        return True
    except Exception as e:
        print(f"Cache set error: {e}")
        return False

async def cache_delete(key: str) -> bool:
    """Delete value from cache"""
    try:
        redis_client = await get_redis()
        await redis_client.delete(key)
        return True
    except Exception as e:
        print(f"Cache delete error: {e}")
        return False

async def cache_delete_pattern(pattern: str) -> bool:
    """Delete all keys matching pattern"""
    try:
        redis_client = await get_redis()
        keys = await redis_client.keys(pattern)
        if keys:
            await redis_client.delete(*keys)
        return True
    except Exception as e:
        print(f"Cache delete pattern error: {e}")
        return False

# Cache decorator for functions
def cache_result(ttl: int = CACHE_TTL, key_prefix: str = ""):
    """Decorator to cache function results"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{key_prefix}{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Check cache
            cached_result = await cache_get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            await cache_set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

# Cache statistics
async def get_cache_stats():
    """Get cache statistics"""
    try:
        redis_client = await get_redis()
        info = await redis_client.info()
        return {
            "connected_clients": info.get("connected_clients", 0),
            "used_memory": info.get("used_memory_human", "0B"),
            "keyspace_hits": info.get("keyspace_hits", 0),
            "keyspace_misses": info.get("keyspace_misses", 0),
            "total_commands_processed": info.get("total_commands_processed", 0)
        }
    except Exception as e:
        return {"error": str(e)}
