# ThaiLLM RAG backend

## First-time setup

1. Create and activate a Python virtual environment.
2. Run `pip install -r requirements.txt`.
3. Copy `.env.example` to `.env`.
4. Set `EMBEDDING_MODEL` to the **exact** model used to create the four JSON embedding files.
5. Run `python import_embeddings.py` once. This creates `chroma_db/`.
6. Start the API with `uvicorn app:app --reload --port 8000`.

The React development server uses `http://localhost:8000` by default. For deployment, add `VITE_API_URL` to the frontend environment with the public backend URL.

## Hardware

`ThaiLLM/ThaiLLM-8B` is downloaded from Hugging Face when the first relevant question is sent. It should be run on an NVIDIA GPU. The default 4-bit setting reduces GPU memory usage. Do not run this model or expose the ChromaDB directory directly in the browser; React communicates only with this API.
