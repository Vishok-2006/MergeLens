import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from app.core.config import settings
from app.core.logging import logger

class QdrantService:
    """Manages semantic collections, batch embedding ingestions, and vector lookups inside Qdrant."""
    
    _client: Optional[QdrantClient] = None

    @classmethod
    def get_client(cls) -> QdrantClient:
        """Instantiates or returns active Qdrant Client."""
        if cls._client is None:
            logger.info(f"Connecting to Qdrant Database at {settings.QDRANT_URL}")
            try:
                if settings.QDRANT_API_KEY:
                    cls._client = QdrantClient(
                        url=settings.QDRANT_URL,
                        api_key=settings.QDRANT_API_KEY
                    )
                else:
                    cls._client = QdrantClient(url=settings.QDRANT_URL)
            except Exception as e:
                logger.error(f"Failed to connect to Qdrant Database: {str(e)}")
                raise
        return cls._client

    @classmethod
    def ensure_collection(cls, vector_size: int = 384) -> None:
        """Ensures the repository collection exists in Qdrant with cosine metrics."""
        client = cls.get_client()
        collection_name = settings.QDRANT_COLLECTION
        
        try:
            collections_list = client.get_collections().collections
            exists = any(c.name == collection_name for c in collections_list)
            
            if not exists:
                logger.info(f"Creating Qdrant Collection: {collection_name} with {vector_size} dimensions")
                client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
                )
        except Exception as e:
            logger.error(f"Error checking or creating Qdrant collection: {str(e)}")
            raise

    @classmethod
    def upload_chunks(
        cls, 
        repository_id: str, 
        analysis_id: str, 
        chunks: List[Dict[str, Any]], 
        embeddings: List[List[float]]
    ) -> None:
        """
        Batch uploads source code chunks along with generated embeddings and rich metadata payloads.
        """
        client = cls.get_client()
        collection_name = settings.QDRANT_COLLECTION
        cls.ensure_collection()

        points = []
        for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            point_id = str(uuid.uuid4())
            payload = {
                "repository_id": repository_id,
                "analysis_id": analysis_id,
                "file_path": chunk["file_path"],
                "chunk_index": chunk["chunk_index"],
                "content": chunk["content"],
                "language": chunk["file_path"].split(".")[-1] if "." in chunk["file_path"] else "unknown"
            }
            points.append(PointStruct(id=point_id, vector=embedding, payload=payload))

        logger.info(f"Uploading {len(points)} point vectors into Qdrant collection: {collection_name}")
        try:
            client.upsert(
                collection_name=collection_name,
                points=points
            )
            logger.info("Successfully upserted points list to Qdrant.")
        except Exception as e:
            logger.error(f"Failed loading indices to Qdrant: {str(e)}")
            raise

    @classmethod
    def search_similar_chunks(
        cls, 
        analysis_id: str, 
        query_vector: List[float], 
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Performs semantic cosine similarity search filtered specifically for given analytical job contexts.
        """
        client = cls.get_client()
        collection_name = settings.QDRANT_COLLECTION
        
        try:
            results = client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="analysis_id",
                            match=MatchValue(value=analysis_id)
                        )
                    ]
                ),
                limit=top_k
            )
            
            hits = []
            for hit in results:
                if hit.payload:
                    hits.append({
                        "file_name": os.path.basename(hit.payload.get("file_path", "")),
                        "chunk_id": hit.id,
                        "path": hit.payload.get("file_path", ""),
                        "content": hit.payload.get("content", ""),
                        "score": hit.score
                    })
            return hits
        except Exception as e:
            logger.error(f"Error executing vector similarity lookup: {str(e)}")
            return []
