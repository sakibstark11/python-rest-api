from setuptools import find_packages, setup

install_requires = [
    "fastapi==0.115.6",
    "uvicorn[standard]==0.34.0",
    "sqlalchemy==2.0.36",
    "psycopg2-binary==2.9.10",
    "python-jose[cryptography]==3.3.0",
    "passlib[bcrypt]==1.7.4",
    "python-multipart==0.0.17",
    "pydantic[email]==2.10.3",
    "pydantic-settings==2.7.0",
    "python-dotenv==1.0.1",
    "asyncpg==0.30.0",
    "greenlet==3.1.1",
    "python-ulid==2.7.0",
]

dev_requires = [
    "pytest==8.3.4",
    "pytest-asyncio==0.24.0",
    "httpx==0.28.1",
    "autopep8==2.3.1",
    "pylint==3.3.2",
]

setup(
    name="calendar-api",
    version="1.0.0",
    description="A REST API for calendar management with user authentication",
    packages=find_packages(),
    python_requires=">=3.13",
    install_requires=install_requires,
    extras_require={
        "dev": dev_requires,
    },
)
