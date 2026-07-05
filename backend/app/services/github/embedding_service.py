from typing import List
from sentence_transformers import SentenceTransformer
from app.core.config import settings
from app.core.logging import logger

class EmbeddingService:
    """Singleton service to compute semantic embeddings using SentenceTransformers."""
    
    _model: SentenceTransformer = None # type: ignore

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        """Lazily instantiates the underlying model pipeline to preserve resource constraints on startup."""
        if cls._model is None:
            logger.info(f"Instantiating SentenceTransformer model: {settings.EMBEDDING_MODEL}")
            try:
                # Load on CPU/GPU automatically
                cls._model = SentenceTransformer(settings.EMBEDDING_MODEL)
            except Exception as e:
                logger.error(f"Error loading embedding model {settings.EMBEDDING_MODEL}: {str(e)}")
                raise
        return cls._model

    @classmethod
    def generate_embedding(cls, text: str) -> List[float]:
        """Generates dense vector embeddings for single string queries."""
        model = cls.get_model()
        vector = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
        return vector.tolist() # type: ignore

    @classmethod
    def generate_embeddings_batch(cls, texts: List[str]) -> List[List[float]]:
        """Efficiently encodes list collections of text in batches."""
        if not texts:
            return []
        model = cls.get_model()
        vectors = model.encode(
            texts, 
            batch_size=32, 
            show_progress_bar=False, 
            normalize_embeddings=True
        )
        return [v.tolist() for v in vectors] # type: ignore
