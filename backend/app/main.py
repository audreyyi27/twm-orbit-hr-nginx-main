import os
import time
from fastapi import FastAPI, Request
 
from fastapi.concurrency import asynccontextmanager
from .routers import auth,candidates,reports,dashboard, get_candidates, employees, teams, projects, attendance, users
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from .limiter import limiter
from .cache import close_redis
from .logging_setup import setup_logging, install_logging, get_logger

# ---- Setup logging first ----
setup_logging()

# ---- OpenAPI tags -----------------------------------------------------------
openapi_tags = [
    {"name": "auth", "description": "Authentication and session endpoints."},
    {"name": "candidates", "description": "Candidate management, stages, stats, email, resume."},
    {"name": "employees", "description": "Employee info."},
    {"name": "reports", "description": "Reporting and exports."},
    {"name": "dashboard", "description": "High-level metrics and widgets."},
    {"name": "teams", "description": "Team management and employee grouping."},
    {"name": "projects", "description": "Project-based management with employee assignments."}
]

# ---- Lifespan (startup/shutdown hooks) -------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger = get_logger("app")
    logger.info("Application startup initiated")
    yield
    # Shutdown
    logger.info("Application shutdown initiated")
    await close_redis()

app = FastAPI(
        title="ORBIT HR System - Backend",
        version=os.getenv("ORBIT_API_VERSION_TAG", "1.0.0"),
        summary="Talent pipeline, candidate management, and HR reporting for Orbit HR.",
        description="Clean, versioned endpoints with strict models, pagination, and sane errors.",
        license_info={"name": "Proprietary"},
        openapi_tags=openapi_tags,
        servers=[
            {"url": f"http://127.0.0.1:8000/", "description": "local"},
            {"url": "/", "description": "production"},
        ],
        lifespan=lifespan,
        docs_url=os.getenv("ORBIT_DOCS_URL", "/docs"),
        redoc_url=os.getenv("ORBIT_REDOC_URL", "/redoc"),
)
# Add logging middleware after app creation but before other middleware
install_logging(app)

 

# Add rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Set CORS_ORIGINS in your .env file: CORS_ORIGINS=http://localhost:3000,http://34.80.84.47
# For production behind nginx, you can use "*" to allow all origins, or specify exact IPs/domains
cors_origins_env = os.getenv("CORS_ORIGINS", "*")

# Normalize origins: strip spaces and trailing slashes so matcher works
if cors_origins_env == "*":
    origins = ["*"]  # Allow all origins (use when behind nginx reverse proxy)
else:
    origins = [origin.strip().rstrip("/") for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff" # Stop MIME-type sniffing attack
    response.headers["X-Frame-Options"] = "DENY" # Prevent clickjacking attacks
    response.headers["X-XSS-Protection"] = "1; mode=block" # optional
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin" # Prevent leaking referrer information
    return response

@app.middleware("http")
async def add_response_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time, 3))
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Driven by env; ensure no trailing slashes
    allow_credentials=True,  # Allow credentials for authenticated requests
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(get_candidates.router)
app.include_router(employees.router)
app.include_router(candidates.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(teams.router)
app.include_router(projects.router)
app.include_router(attendance.router)


@app.get("/", tags=["home"], summary="Healthcheck", response_description="Service is up.")
async def root():
    return {'msg':'Orbit HR Backend running'}

@app.get("/health", tags=["home"], summary="Health check with DB", response_description="Service and database status")
async def health_check():
    """Health check endpoint that verifies database connectivity"""
    from .db import check_db_connection, get_pool_status
    
    db_healthy = await check_db_connection()
    pool_status = await get_pool_status()
    
    if db_healthy:
        return {
            "status": "healthy",
            "database": "connected",
            "pool": pool_status
        }
    else:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "pool": pool_status
        }