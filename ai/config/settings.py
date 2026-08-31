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

    # Krill Web Search Settings
    KRILL_API_KEY: str = os.getenv("KRILL_API_KEY", "")
    KRILL_SEARCH_URL: str = os.getenv("KRILL_SEARCH_URL", "https://api.krill.sh/v1/search")
    KRILL_ENABLED: bool = os.getenv("KRILL_ENABLED", "true").lower() in ("true", "1", "yes")
    KRILL_MAX_RESULTS: int = int(os.getenv("KRILL_MAX_RESULTS", "3"))

    # Supported audio formats
    SUPPORTED_AUDIO_EXTENSIONS: List[str] = field(
        default_factory=lambda: [".wav", ".mp3", ".m4a", ".flac", ".ogg", ".aac", ".wma"]
    )

    # CRM Enums matching src/types/index.ts
    VALID_SENTIMENTS: List[str] = field(
        default_factory=lambda: ["positive", "neutral", "negative"]
    )
    VALID_DEAL_STAGES: List[str] = field(
        default_factory=lambda: ["prospecting", "negotiation", "closing", "won", "lost"]
    )

settings = AISettings()

