import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/mergelens",
        description="Async PostgreSQL Connection string"
    )
    QDRANT_URL: str = Field(
        default="http://localhost:6333",
        description="Qdrant service URL"
    )
    QDRANT_API_KEY: str = Field(
        default="",
        description="Qdrant API Key"
    )
    QDRANT_COLLECTION: str = Field(
        default="repository_chunks",
        description="Name of the Qdrant collection"
    )
    GEMINI_API_KEY: str = Field(
        default="",
        description="Google Gemini API secret key"
    )
    GITHUB_TOKEN: str = Field(
        default="",
        description="Optional GitHub personal access token to prevent rate limits"
    )
    EMBEDDING_MODEL: str = Field(
        default="BAAI/bge-small-en-v1.5",
        description="Sentence Transformers model used for embedding indexing"
    )
    TEMP_DIRECTORY: str = Field(
        default="/tmp/mergelens",
        description="Directory used to clone repositories"
    )
    MAX_FILE_SIZE: int = Field(
        default=512 * 1024, # 512 KB
        description="Max file size in bytes to index"
    )
    MAX_REPOSITORY_SIZE: int = Field(
        default=50 * 1024 * 1024, # 50 MB
        description="Max total workspace folder size allowed to analyze"
    )
    CHUNK_SIZE: int = Field(
        default=800,
        description="Number of tokens per text chunk"
    )
    CHUNK_OVERLAP: int = Field(
        default=150,
        description="Overlap margin size in tokens"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
