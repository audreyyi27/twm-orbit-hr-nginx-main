import random
import string
import asyncio
from typing import List, Dict, Optional
from dataclasses import dataclass

@dataclass
class TestUser:
    username: str
    password: str
    email: str
    access_token: Optional[str] = None
    user_id: Optional[str] = None

class UserManager:
    def __init__(self, base_username: str = "loadtest"):
        self.base_username = base_username
        self.users: List[TestUser] = []
        self.token_pool: List[str] = []
    
    def generate_test_user(self) -> TestUser:
        suffix = ''.join(random.choices(string.digits, k=6))
        username = f"{self.base_username}_{suffix}"
        email = f"{username}@loadtest.example.com"
        password = "LoadTest123!"
        
        return TestUser(
            username=username,
            password=password,
            email=email
        )
    
    def create_user_batch(self, count: int) -> List[TestUser]:
        users = []
        for _ in range(count):
            users.append(self.generate_test_user())
        return users
    
    def get_random_user(self) -> TestUser:
        """Get a random user from the pool"""
        if not self.users:
            self.users = self.create_user_batch(10)
        return random.choice(self.users)

class TokenManager:
    """
    Manages JWT tokens for load testing
    Handles token refresh and pooling
    """
    
    def __init__(self):
        self.active_tokens: Dict[str, str] = {}  # user_id -> token
        self.token_expiry: Dict[str, float] = {}  # token -> expiry_time
    
    def add_token(self, user_id: str, token: str, expires_in: int = 3600):
        """Add a token to the pool"""
        self.active_tokens[user_id] = token
        import time
        self.token_expiry[token] = time.time() + expires_in
    
    def get_valid_token(self, user_id: str) -> Optional[str]:
        """Get a valid token for a user"""
        token = self.active_tokens.get(user_id)
        if token and self.is_token_valid(token):
            return token
        return None
    
    def is_token_valid(self, token: str) -> bool:
        """Check if token is still valid"""
        if token not in self.token_expiry:
            return False
        import time
        return time.time() < self.token_expiry[token]
    
    def invalidate_token(self, token: str):
        """Remove token from pool"""
        if token in self.token_expiry:
            del self.token_expiry[token]
        # Remove from active_tokens
        for user_id, t in list(self.active_tokens.items()):
            if t == token:
                del self.active_tokens[user_id]
                break

class Config:
    """
    Configuration for load testing
    Industry standard settings
    """
    
    # Test user settings
    MAX_CONCURRENT_USERS = 100
    USER_CREATION_BATCH_SIZE = 10
    
    # Token settings
    TOKEN_REFRESH_THRESHOLD = 300  # Refresh 5 minutes before expiry
    MAX_TOKEN_POOL_SIZE = 50
    
    # Test data settings
    USE_REALISTIC_DATA = True
    CLEANUP_AFTER_TEST = True
    
    # Rate limiting
    REQUESTS_PER_SECOND = 10
    BURST_LIMIT = 50

# Global instances
user_manager = UserManager()
token_manager = TokenManager()
config = Config()
