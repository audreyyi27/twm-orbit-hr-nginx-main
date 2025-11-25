import os
import random
import time
from locust import HttpUser, task, between
from dotenv import load_dotenv
from app.test.load_test_utils import user_manager, token_manager, config, TestUser

# Load environment variables
load_dotenv()

class CandidatesUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Initialize user with proper authentication"""
        # Use existing HR user for candidates API access
        self.test_user = TestUser(
            username=os.getenv("TEST_USER_USERNAME", "john"),
            password=os.getenv("TEST_USER_PASSWORD", "secret123"),
            email="john@example.com"
        )
        self.ensure_authentication()
    
    def ensure_authentication(self):
        """Ensure we have valid authentication"""
        # Check if we have a valid token
        if hasattr(self, 'user_id') and token_manager.get_valid_token(self.user_id):
            self.access_token = token_manager.get_valid_token(self.user_id)
            self.headers = {"Authorization": f"Bearer {self.access_token}"}
            return
        
        # Need to authenticate
        self.authenticate()
    
    def authenticate(self):
        """Authenticate user and store token"""
        # Just login with existing user (no registration needed)
        login_data = {
            "username": self.test_user.username,
            "password": self.test_user.password
        }
        
        with self.client.post("/auth/login", json=login_data, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                self.headers = {"Authorization": f"Bearer {self.access_token}"}
                
                # Store token in manager
                if self.user_id and self.access_token:
                    token_manager.add_token(self.user_id, self.access_token)
                
                response.success()
            else:
                response.failure(f"Authentication failed: {response.status_code}")
                raise Exception("Authentication failed")
    
    def handle_auth_error(self, response):
        """Handle authentication errors by re-authenticating"""
        if response.status_code == 401:
            self.authenticate()
            return True
        return False
    
    @task(30)
    def get_candidates_list(self):
        """Get candidates list with pagination"""
        self.ensure_authentication()
        
        page = random.randint(1, 20)
        per_page = random.choice([10, 25, 50, 100])
        sort_order = random.choice(["asc", "desc"])
        
        params = {
            "page": page,
            "per_page": per_page,
            "sort_order": sort_order
        }
        
        with self.client.get("/api/candidates", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                if "items" in data and "meta" in data:
                    response.success()
                else:
                    response.failure("Invalid response format")
            elif self.handle_auth_error(response):
                # Retry after re-authentication
                with self.client.get("/api/candidates", params=params, headers=self.headers, catch_response=True) as retry_response:
                    if retry_response.status_code == 200:
                        retry_response.success()
                    else:
                        retry_response.failure(f"Retry failed: {retry_response.status_code}")
            else:
                response.failure(f"Failed to get candidates: {response.status_code}")
    
    @task(20)
    def search_candidates(self):
        """Search candidates with various terms"""
        self.ensure_authentication()
        
        search_terms = ["python", "java", "react", "django", "senior", "junior", "frontend", "backend", "developer", "engineer"]
        search_term = random.choice(search_terms)
        
        params = {
            "page": 1,
            "per_page": 25,
            "search": search_term,
            "sort_order": "desc"
        }
        
        with self.client.get("/api/candidates", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif self.handle_auth_error(response):
                with self.client.get("/api/candidates", params=params, headers=self.headers, catch_response=True) as retry_response:
                    if retry_response.status_code == 200:
                        retry_response.success()
                    else:
                        retry_response.failure(f"Search retry failed: {retry_response.status_code}")
            else:
                response.failure(f"Search failed: {response.status_code}")
    
    @task(15)
    def filter_candidates(self):
        """Filter candidates by status"""
        self.ensure_authentication()
        
        statuses = ["applied", "screened", "interview_team_lead", "interview_general_manager", "hired", "rejected"]
        status = random.choice(statuses)
        
        params = {
            "page": 1,
            "per_page": 25,
            "candidate_status": status,
            "sort_order": "desc"
        }
        
        with self.client.get("/api/candidates", params=params, headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif self.handle_auth_error(response):
                with self.client.get("/api/candidates", params=params, headers=self.headers, catch_response=True) as retry_response:
                    if retry_response.status_code == 200:
                        retry_response.success()
                    else:
                        retry_response.failure(f"Filter retry failed: {retry_response.status_code}")
            else:
                response.failure(f"Filter failed: {response.status_code}")
    
    @task(10)
    def get_candidate_details(self):
        """Get specific candidate details"""
        self.ensure_authentication()
        
        # Use a known candidate ID (you might want to make this dynamic)
        candidate_id = "c5c303dd-2c64-4149-aa23-54fe7cf1e219"
        
        with self.client.get(f"/api/candidates/{candidate_id}", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif self.handle_auth_error(response):
                with self.client.get(f"/api/candidates/{candidate_id}", headers=self.headers, catch_response=True) as retry_response:
                    if retry_response.status_code == 200:
                        retry_response.success()
                    else:
                        retry_response.failure(f"Details retry failed: {retry_response.status_code}")
            else:
                response.failure(f"Failed to get candidate details: {response.status_code}")
    
    @task(5)
    def get_candidate_stats(self):
        """Get candidate statistics"""
        self.ensure_authentication()
        
        with self.client.get("/api/candidates/stats/count", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif self.handle_auth_error(response):
                with self.client.get("/api/candidates/stats/count", headers=self.headers, catch_response=True) as retry_response:
                    if retry_response.status_code == 200:
                        retry_response.success()
                    else:
                        retry_response.failure(f"Stats retry failed: {retry_response.status_code}")
            else:
                response.failure(f"Failed to get stats: {response.status_code}")

class AuthUser(HttpUser):
    """
    Load testing for authentication API
    Tests registration, login, logout patterns
    """
    wait_time = between(2, 5)
    
    def on_start(self):
        """Initialize with a unique test user"""
        # Use existing test user to avoid registration issues
        self.test_user = TestUser(
            username=os.getenv("TEST_USER_USERNAME", ""),
            password=os.getenv("TEST_USER_PASSWORD", ""),
        )
        self.authenticated = False
        # Just login with existing user
        self.login_only()
    
    def login_only(self):
        """Login with existing user"""
        login_data = {
            "username": self.test_user.username,
            "password": self.test_user.password
        }
        
        with self.client.post("/auth/login", json=login_data, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                self.headers = {"Authorization": f"Bearer {self.access_token}"}
                self.authenticated = True
                response.success()
            else:
                response.failure(f"Login failed: {response.status_code}")
    
    def register_and_login(self):
        """Register user first, then login"""
        # Step 1: Register
        register_data = {
            "username": self.test_user.username,
            "password": self.test_user.password,
            "email": self.test_user.email,
            "fullname": f"Load Test User {self.test_user.username}",
            "employee_id": f"EMP{random.randint(1000, 9999)}",
            "phone": f"+628{random.randint(10000000, 99999999)}"
        }
        
        with self.client.post("/auth/register", json=register_data, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 400:
                # User already exists, that's okay
                response.success()
            else:
                response.failure(f"Registration failed: {response.status_code}")
                return
        
        # Step 2: Login
        login_data = {
            "username": self.test_user.username,
            "password": self.test_user.password
        }
        
        with self.client.post("/auth/login", json=login_data, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                self.headers = {"Authorization": f"Bearer {self.access_token}"}
                self.authenticated = True
                response.success()
            else:
                response.failure(f"Login failed: {response.status_code}")
    
    @task(40)
    def test_login(self):
        """Test login functionality"""
        if not self.authenticated:
            self.register_and_login()
            return
            
        login_data = {
            "username": self.test_user.username,
            "password": self.test_user.password
        }
        
        with self.client.post("/auth/login", json=login_data, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                self.headers = {"Authorization": f"Bearer {self.access_token}"}
                self.authenticated = True
                response.success()
            else:
                response.failure(f"Login failed: {response.status_code}")
    
    @task(20)
    def test_register(self):
        """Test user registration"""
        # Generate a new unique user for registration
        new_user = user_manager.generate_test_user()
        
        register_data = {
            "username": new_user.username,
            "password": new_user.password,
            "email": new_user.email,
            "full_name": f"Load Test User {new_user.username}"
        }
        
        with self.client.post("/auth/register", json=register_data, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 400:
                # User already exists, that's okay
                response.success()
            else:
                response.failure(f"Registration failed: {response.status_code}")
    
    @task(10)
    def test_logout(self):
        """Test logout functionality"""
        if hasattr(self, 'access_token') and self.access_token:
            with self.client.post("/auth/logout", headers=self.headers, catch_response=True) as response:
                if response.status_code in [200, 204]:
                    self.authenticated = False
                    response.success()
                else:
                    response.failure(f"Logout failed: {response.status_code}")
    
    @task(5)
    def test_invalid_login(self):
        """Test invalid login (should fail)"""
        invalid_data = {
            "username": "nonexistent_user",
            "password": "wrong_password"
        }
        
        with self.client.post("/auth/login", json=invalid_data, catch_response=True) as response:
            if response.status_code in [401, 422]:
                response.success()  # Expected to fail
            else:
                response.failure(f"Expected 401/422, got {response.status_code}")
