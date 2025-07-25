from setuptools import find_packages, setup

install_requires = [
    "fastapi==0.104.1",
    "uvicorn[standard]==0.24.0",
    "sqlalchemy==2.0.23",
    "psycopg2-binary==2.9.9",
    "python-jose[cryptography]==3.3.0",
    "passlib[bcrypt]==1.7.4",
    "python-multipart==0.0.6",
    "pydantic[email]==2.5.0",
    "pydantic-settings==2.1.0",
    "python-dotenv==1.0.0",
    "asyncpg==0.29.0",
]

dev_requires = [
    "pytest==7.4.3",
    "pytest-asyncio==0.21.1",
    "httpx==0.25.2",
    "autopep8==2.0.4",
    "pylint==3.0.3",
]

setup(
    name="calendar-api",
    version="1.0.0",
    description="A REST API for calendar management with user authentication",
    packages=find_packages(),
    python_requires=">=3.11",
    install_requires=install_requires,
    extras_require={
        "dev": dev_requires,
    },
)
