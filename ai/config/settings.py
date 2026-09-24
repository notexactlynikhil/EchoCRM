import os
from dataclasses import dataclass, field
from typing import List

@dataclass
class AISettings:
    # Transcription Settings
    WHISPER_MODEL_SIZE: str = os.getenv("WHISPER_MODEL_SIZE", "base")
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu")
    WHISPER_COMPUTE_TYPE: str = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

    # Local Llama.cpp Settings
    LLAMA_GGUF_PATH: str = os.getenv("LLAMA_GGUF_PATH", "llama-runtime/models/llama-3.2-3b-instruct-q4_k_m.gguf")
    LLAMA_CTX_SIZE: int = int(os.getenv("LLAMA_CTX_SIZE", "4096"))

    # Supported audio formats
    SUPPORTED_AUDIO_EXTENSIONS: List[str] = field(
        default_factory=lambda: [".wav", ".mp3", ".m4a", ".flac", ".ogg", ".aac", ".wma", ".webm"]
    )

    # CRM Enums matching src/types/index.ts
    VALID_SENTIMENTS: List[str] = field(
        default_factory=lambda: ["positive", "neutral", "negative"]
    )
    VALID_DEAL_STAGES: List[str] = field(
        default_factory=lambda: ["prospecting", "negotiation", "closing", "won", "lost"]
    )

settings = AISettings()

