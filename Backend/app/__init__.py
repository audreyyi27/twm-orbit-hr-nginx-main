from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv


load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')


engine = create_async_engine(
    DATABASE_URL, 
    future=True, 
    echo=False, 
    pool_size=int(os.getenv('POOL_SIZE', 10)),
    max_overflow=int(os.getenv('MAX_OVERFLOW', 20)),
    pool_timeout=int(os.getenv('POOL_TIMEOUT', 30)),
    pool_recycle=int(os.getenv('POOL_RECYCLE', 1800)),
    pool_pre_ping=os.getenv('POOL_PRE_PING', 'true').lower() == 'true',
    connect_args={
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0
    }
)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


async def init_db():
    # Create all tables (for MVP; replace with Alembic migrations for prod)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('DB initialized')


# dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

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