from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from sqlalchemy import text
from fastapi import HTTPException
import os
from dotenv import load_dotenv
import logging

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

logger = logging.getLogger(__name__)

# Production-ready connection settings for asyncpg
engine = create_async_engine(
    DATABASE_URL, 
    future=True, 
    echo=False, 
    pool_size=int(os.getenv('POOL_SIZE', 10)),
    max_overflow=int(os.getenv('MAX_OVERFLOW', 20)),
    pool_timeout=int(os.getenv('POOL_TIMEOUT', 30)),
    pool_recycle=int(os.getenv('POOL_RECYCLE', 1800)),  # Recycle connections after 30 minutes
    pool_pre_ping=os.getenv('POOL_PRE_PING', 'true').lower() == 'true',  # Verify connections before use
    connect_args={
        "command_timeout": int(os.getenv('DB_COMMAND_TIMEOUT', 60)),  # 60 seconds for queries
        "server_settings": {
            "application_name": "hr_system_backend",
            "tcp_keepalives_idle": "600",  # 10 minutes
            "tcp_keepalives_interval": "30",  # 30 seconds
            "tcp_keepalives_count": "3",
        }
    }
)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


async def init_db():
    # Create all tables (for MVP; replace with Alembic migrations for prod)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('DB initialized')


# dependency with error handling
async def get_db():
    session = None
    try:
        session = AsyncSessionLocal()
        yield session
    except HTTPException:
        # Don't log HTTPExceptions - these are intentional API responses
        # Just rollback and re-raise
        if session:
            await session.rollback()
        raise
    except SQLAlchemyError as e:
        if session:
            await session.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    except Exception as e:
        if session:
            await session.rollback()
        logger.error(f"Unexpected error in get_db: {str(e)}")
        raise
    finally:
        if session:
            await session.close()

# optional
async def get_pool_status():
    pool = engine.pool
    status = {
        "size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
    }
    # Not all pool implementations expose an "invalid" metric.
    invalid_attr = getattr(pool, "invalid", None)
    if callable(invalid_attr):
        status["invalid"] = invalid_attr()
    else:
        status["invalid"] = None
    return status

# Database health check
async def check_db_connection():
    """Check if database connection is healthy"""
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            result.fetchone()  # Execute the query
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {str(e)}")
        return False