import os
from dotenv import load_dotenv
from locust import events

# Load environment variables
load_dotenv()

# Import load testing classes
from app.test.load_test import CandidatesUser, AuthUser


# Export the test classes for Locust
__all__ = [
    "CandidatesUser",
    "AuthUser"
]

# Event handlers for monitoring
@events.request.add_listener
def on_request(name, response_time, exception, **kwargs):
    """Global request handler for all tests"""
    if exception:
        print(f"Request failed: {name} - {exception}")
    elif response_time > 5000:  # Log slow requests (>5 seconds)
        print(f"Slow request: {name} took {response_time}ms")

@events.user_error.add_listener
def on_user_error(user_instance, exception, tb, **kwargs):
    """Global user error handler"""
    print(f"User error: {exception}")

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when the test starts"""
    print("🚀 Starting HR System Load Test")
    print(f"Target host: {environment.host}")
    print(f"Test users: {environment.parsed_options.num_users}")
    print(f"Ramp up time: {environment.parsed_options.spawn_rate} users/second")

@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when the test stops"""
    print("🏁 HR System Load Test Completed")
