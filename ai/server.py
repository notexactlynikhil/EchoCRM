import os
import sys
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

# Add project root to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ai.config.settings import settings
from ai.pipeline.orchestrator import process_call, CallPipeline
from ai.analysis.llm_provider import get_llm_provider
from ai.analysis.smart_query import SmartQueryOrchestrator

app = FastAPI(title="Wavelength AI Service", version="1.0.0")

smart_orchestrator = SmartQueryOrchestrator()

class ProcessCallRequest(BaseModel):
    audio_path: Optional[str] = None

class QueryRequest(BaseModel):
    prompt: str
    context: Optional[str] = ""
    enable_web_search: Optional[bool] = None

@app.get("/health")
def health_check():
    """Health check endpoint to verify Python AI service availability and Krill web search config."""
    provider = get_llm_provider()
    return {
        "status": "ok",
        "service": "wavelength-ai",
        "whisper_model": settings.WHISPER_MODEL_SIZE,
        "llm_provider": provider.get_provider_name(),
        "llm_model": provider.get_model_name(),
        "krill_search_enabled": settings.KRILL_ENABLED,
        "krill_api_key_configured": bool(settings.KRILL_API_KEY)
    }

@app.post("/process-call")
def handle_process_call(request: ProcessCallRequest) -> Dict[str, Any]:
    """
    Processes local audio call recording via Whisper + Ollama LLM.
    Returns transcript, structured CRM analysis, and execution metadata.
    Does NOT depend on Krill/Internet (100% Local-First).
    """
    audio_path = request.audio_path
    
    # Default to sample audio if no path provided or relative name passed
    if not audio_path:
        audio_path = os.path.join("test", "sample-audio", "sample.wav")
    elif not os.path.isabs(audio_path) and not os.path.exists(audio_path):
        alt_path = os.path.join("test", "sample-audio", audio_path)
        if os.path.exists(alt_path):
            audio_path = alt_path

    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail=f"Audio file not found at path: {audio_path}")

    try:
        result = process_call(audio_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing exception: {str(e)}")

@app.post("/query")
def handle_query(request: QueryRequest) -> Dict[str, Any]:
    """
    Executes local-first query with optional Krill web search for external information.
    """
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt query string cannot be empty")

    try:
        result = smart_orchestrator.execute_query(
            query=request.prompt,
            context=request.context,
            force_web_search=request.enable_web_search
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query execution failed: {str(e)}")

def main():

    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    print(f"Starting Wavelength AI Service on http://127.0.0.1:{port}")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")

if __name__ == "__main__":
    main()
