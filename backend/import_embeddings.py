"""Import precomputed curriculum embeddings into persistent ChromaDB collections."""

import json
import shutil
from pathlib import Path

import chromadb

BASE_DIR = Path(__file__).resolve().parent
EMBEDDINGS_DIR = BASE_DIR / "embeddings"
DATABASE_DIR = BASE_DIR / "chroma_db"

SOURCES = {
    "it": "IT2565_embedded_chunks.json",
    "dsba": "embedded_DSBA.json",
    "it-inter": "embedded_IT_inter2565 (1).json",
    "ait": "embedded_AIT_chunks.json",
}


def load_records(course_id: str, file_name: str) -> tuple[list[str], list[list[float]], list[dict], list[str]]:
    """Normalize the two supplied JSON layouts into ChromaDB records."""
    with (EMBEDDINGS_DIR / file_name).open(encoding="utf-8") as file:
        payload = json.load(file)

    chunks = payload["chunks"] if isinstance(payload, dict) else payload
    ids, documents, embeddings, metadatas = [], [], [], []

    for index, chunk in enumerate(chunks, start=1):
        text = chunk.get("text") or chunk.get("content")
        embedding = chunk.get("embedding")
        if not isinstance(text, str) or not text.strip() or not isinstance(embedding, list):
            raise ValueError(f"{file_name}: chunk {index} has no valid text or embedding")

        page_start = chunk.get("page_start", chunk.get("page", 0))
        page_end = chunk.get("page_end", page_start)
        source = str(chunk.get("source", file_name))
        chunk_id = str(chunk.get("chunk_id", index))

        ids.append(f"{course_id}-{chunk_id}")
        documents.append(text)
        embeddings.append(embedding)
        metadatas.append({
            "course_id": course_id,
            "source_file": source,
            "page_start": int(page_start or 0),
            "page_end": int(page_end or page_start or 0),
        })

    return ids, embeddings, metadatas, documents


def main() -> None:
    if DATABASE_DIR.exists():
        shutil.rmtree(DATABASE_DIR)

    client = chromadb.PersistentClient(path=str(DATABASE_DIR))

    for course_id, file_name in SOURCES.items():
        ids, embeddings, metadatas, documents = load_records(course_id, file_name)
        collection = client.get_or_create_collection(
            name=f"{course_id}_curriculum",
            metadata={"hnsw:space": "cosine"},
        )
        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents,
        )
        print(f"Imported {len(ids)} chunks into {collection.name}")

    print(f"ChromaDB is ready at: {DATABASE_DIR}")


if __name__ == "__main__":
    main()
