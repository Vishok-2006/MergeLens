from typing import List, Dict, Any

class CodeChunker:
    """Chunks source files and documentation contents logically with overlap boundaries."""

    @classmethod
    def chunk_file(cls, file_path: str, content: str, chunk_size_tokens: int = 800, overlap_tokens: int = 150) -> List[Dict[str, Any]]:
        """
        Calculates character boundaries using standard proxy metrics: 1 token ≈ 4.2 characters.
        This ensures performant, reliable chunking on any host system.
        """
        char_limit = int(chunk_size_tokens * 4.2)
        char_overlap = int(overlap_tokens * 4.2)
        
        if len(content) <= char_limit:
            return [{
                "file_path": file_path,
                "chunk_index": 0,
                "content": content,
                "length_chars": len(content)
            }]

        chunks = []
        start = 0
        chunk_idx = 0
        
        while start < len(content):
            end = start + char_limit
            chunk_text = content[start:end]
            
            # Align boundaries to newlines if available to avoid cutting codes mid-line
            if end < len(content):
                last_newline = chunk_text.rfind("\n")
                if last_newline > int(char_limit * 0.7):
                    end = start + last_newline + 1
                    chunk_text = content[start:end]
            
            chunks.append({
                "file_path": file_path,
                "chunk_index": chunk_idx,
                "content": chunk_text,
                "length_chars": len(chunk_text)
            })
            
            start += (len(chunk_text) - char_overlap) if len(chunk_text) > char_overlap else char_limit
            chunk_idx += 1
            
            # Escape infinite cycles
            if len(chunk_text) == 0:
                break
                
        return chunks
