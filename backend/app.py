"""RAG API: retrieve curriculum context from ChromaDB, then answer with ThaiLLM."""

import os
from functools import lru_cache
from pathlib import Path

import chromadb
import torch
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DATABASE_DIR = BASE_DIR / "chroma_db"
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
THAILLM_MODEL = os.getenv("THAILLM_MODEL", "ThaiLLM/ThaiLLM-8B")
MAX_NEW_TOKENS = int(os.getenv("MAX_NEW_TOKENS", "300"))
MIN_SIMILARITY = float(os.getenv("MIN_SIMILARITY", "0.35"))
COURSE_IDS = {"it", "dsba", "it-inter", "ait"}

app = FastAPI(title="ThaiLLM Curriculum RAG API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[item.strip() for item in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")],
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1_000)
    course_id: str = Field(alias="courseId")


class Citation(BaseModel):
    source_file: str
    page_start: int
    page_end: int


class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation] = []


@lru_cache
def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(EMBEDDING_MODEL)


@lru_cache
def get_collection(course_id: str):
    if not DATABASE_DIR.exists():
        raise RuntimeError("Vector DB not found. Run python import_embeddings.py first.")
    client = chromadb.PersistentClient(path=str(DATABASE_DIR))
    return client.get_collection(f"{course_id}_curriculum")


@lru_cache
def get_llm():
    tokenizer = AutoTokenizer.from_pretrained(THAILLM_MODEL)
    model_options = {"device_map": "auto"}

    if os.getenv("THAILLM_LOAD_IN_4BIT", "true").lower() == "true" and torch.cuda.is_available():
        model_options["quantization_config"] = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
        )
    else:
        model_options["torch_dtype"] = torch.float16 if torch.cuda.is_available() else torch.float32

    model = AutoModelForCausalLM.from_pretrained(THAILLM_MODEL, **model_options)
    model.eval()
    return tokenizer, model


def retrieve(question: str, course_id: str) -> tuple[list[str], list[Citation]]:
    query_embedding = get_embedding_model().encode(question, normalize_embeddings=True).tolist()
    result = get_collection(course_id).query(
        query_embeddings=[query_embedding],
        n_results=4,
        include=["documents", "metadatas", "distances"],
    )

    documents = result["documents"][0]
    metadatas = result["metadatas"][0]
    distances = result["distances"][0]
    selected = [
        (document, metadata)
        for document, metadata, distance in zip(documents, metadatas, distances)
        if 1 - distance >= MIN_SIMILARITY
    ]

    citations = [
        Citation(
            source_file=metadata["source_file"],
            page_start=metadata["page_start"],
            page_end=metadata["page_end"],
        )
        for _, metadata in selected
    ]
    return [document for document, _ in selected], citations


def generate_answer(question: str, contexts: list[str]) -> str:
    context_text = "\n\n---\n\n".join(contexts)
    prompt = f"""คุณคือผู้ช่วยตอบคำถามเกี่ยวกับหลักสูตรของ IT KMITL

กฎที่ต้องปฏิบัติตาม:
- ตอบจากข้อมูลใน CONTEXT เท่านั้น
- ห้ามเดา ห้ามใช้ความรู้ภายนอก และห้ามสร้างข้อมูลที่ไม่มีใน CONTEXT
- ถ้า CONTEXT ตอบคำถามไม่ได้ ให้ตอบว่า "ไม่พบข้อมูลนี้ในเอกสารของหลักสูตรที่เลือก"
- ตอบเป็นภาษาไทยอย่างกระชับ

CONTEXT:
{context_text}

QUESTION:
{question}

ANSWER:
"""
    tokenizer, model = get_llm()
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    with torch.inference_mode():
        output = model.generate(
            **inputs,
            max_new_tokens=MAX_NEW_TOKENS,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
        )

    generated_tokens = output[0][inputs["input_ids"].shape[1]:]
    return tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()


@app.get("/health")
def health_check():
    return {"status": "ok", "vector_db_ready": DATABASE_DIR.exists()}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if request.course_id not in COURSE_IDS:
        raise HTTPException(status_code=400, detail="Unknown course.")

    question = request.question.strip()
    contexts, citations = retrieve(question, request.course_id)
    if not contexts:
        return ChatResponse(
            answer=(
                "ไม่พบข้อมูลที่เกี่ยวข้องกับคำถามนี้ในเอกสารของหลักสูตรที่เลือก\n\n"
                "กรุณาลองระบุชื่อรายวิชา หัวข้อ หรือรายละเอียดของคำถามเพิ่มเติม "
                "เพื่อให้ระบบค้นหาข้อมูลได้อย่างแม่นยำยิ่งขึ้น"
            ),
            citations=[],
        )

    return ChatResponse(
        answer=generate_answer(question, contexts),
        citations=citations,
    )
