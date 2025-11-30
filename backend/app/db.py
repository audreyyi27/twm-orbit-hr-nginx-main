from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from sqlalchemy import text
import os
from dotenv import load_dotenv
import logging

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')


# Attendance Database Configuration
ATTENDANCE_DATABASE_URL = os.getenv('ATTENDANCE_DATABASE_URL')



if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

if not ATTENDANCE_DATABASE_URL:
    raise ValueError("ATTENDANCE_DATABASE_URL environment variable is not set")



logger = logging.getLogger(__name__)

# ==================== HR DATABASE ====================
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
AsyncSessionLocal = async_sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()


# ==================== ATTENDANCE DATABASE ====================
# Production-ready connection settings for Attendance database
attendance_engine = create_async_engine(
    ATTENDANCE_DATABASE_URL, 
    future=True, 
    echo=False, 
    pool_size=int(os.getenv('ATTENDANCE_POOL_SIZE', 10)),
    max_overflow=int(os.getenv('ATTENDANCE_MAX_OVERFLOW', 20)),
    pool_timeout=int(os.getenv('ATTENDANCE_POOL_TIMEOUT', 30)),
    pool_recycle=int(os.getenv('ATTENDANCE_POOL_RECYCLE', 1800)),
    pool_pre_ping=os.getenv('ATTENDANCE_POOL_PRE_PING', 'true').lower() == 'true',
    connect_args={
        "command_timeout": int(os.getenv('ATTENDANCE_DB_COMMAND_TIMEOUT', 60)),
        "server_settings": {
            "application_name": "attendance_system_backend",
            "tcp_keepalives_idle": "600",
            "tcp_keepalives_interval": "30",
            "tcp_keepalives_count": "3",
        }
    }
)
AttendanceAsyncSessionLocal = async_sessionmaker(
    bind=attendance_engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)
AttendanceBase = declarative_base()


# ==================== INITIALIZATION ====================
async def init_db():
    # Create all tables (for MVP; replace with Alembic migrations for prod)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('DB initialized')

async def init_attendance_db():
    """Initialize Attendance database tables"""
    async with attendance_engine.begin() as conn:
        await conn.run_sync(AttendanceBase.metadata.create_all)
    print('Attendance Database initialized')


async def init_all_databases():
    """Initialize both databases"""
    await init_db()
    await init_attendance_db()
    print('All databases initialized')



# ==================== DATABASE DEPENDENCIES ====================
# dependency with error handling
async def get_db():
    session = None
    try:
        session = AsyncSessionLocal()
        yield session
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


# Attendance Database dependency with error handling
async def get_attendance_db():
    session = None
    try:
        session = AttendanceAsyncSessionLocal()
        yield session
    except SQLAlchemyError as e:
        if session:
            await session.rollback()
        logger.error(f"Attendance Database error: {str(e)}")
        raise
    except Exception as e:
        if session:
            await session.rollback()
        logger.error(f"Unexpected error in get_attendance_db: {str(e)}")
        raise
    finally:
        if session:
            await session.close()



# ==================== POOL STATUS ====================

# optional
async def get_pool_status():
    pool = engine.pool
    return {
        "size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "invalid": pool.invalid()
    }

async def get_attendance_pool_status():
    """Get Attendance database pool status"""
    pool = attendance_engine.pool
    return {
        "database": "Attendance",
        "size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "invalid": pool.invalid()
    }


# ==================== HEALTH CHECKS ====================

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

async def check_attendance_db_connection():
    """Check if Attendance database connection is healthy"""
    try:
        async with attendance_engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            result.fetchone()
        return True
    except Exception as e:
        logger.error(f"Attendance Database connection check failed: {str(e)}")
        return False
