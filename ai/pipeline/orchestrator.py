import os
import time
import traceback
from typing import Dict, Any, Optional

from ai.config.settings import settings
from ai.transcription.transcriber import AudioTranscriber
from ai.analysis.llm_provider import get_llm_provider, LLMProvider
from ai.analysis.prompts import SYSTEM_PROMPT, build_analysis_prompt
from ai.analysis.transcript_cleaner import clean_transcript
from ai.analysis.validator import JSONValidator

class CallPipeline:
    """
    Complete audio processing pipeline for EchoCRM AI:
    Audio -> Speech-to-Text -> Local LLM -> Structured JSON
    """

    def __init__(
        self,
        transcriber: Optional[AudioTranscriber] = None,
        llm_provider: Optional[LLMProvider] = None
    ):
        self.transcriber = transcriber or AudioTranscriber()
        self.llm_provider = llm_provider or get_llm_provider()

    def process_call(self, audio_path: str) -> Dict[str, Any]:
        start_total_time = time.time()
        errors = []

        # Result structure
        result: Dict[str, Any] = {
            "status": "PIPELINE_ERROR",
            "audio_path": audio_path,
            "transcript": "",
            "clean_transcript": "",
            "analysis": {},
            "metadata": {
                "processing_time_seconds": 0.0,
                "audio_duration_seconds": 0.0,
                "transcription_model": settings.WHISPER_MODEL_SIZE,
                "llm_provider": self.llm_provider.get_provider_name(),
                "llm_model": self.llm_provider.get_model_name(),
                "errors": errors
            }
        }

        # Step 1: Validate Audio File
        try:
            self.transcriber.validate_audio_file(audio_path)
        except Exception as e:
            err_msg = f"AUDIO_ERROR: {str(e)}"
            errors.append(err_msg)
            result["status"] = "AUDIO_ERROR"
            result["metadata"]["errors"] = errors
            result["metadata"]["processing_time_seconds"] = round(time.time() - start_total_time, 3)
            return result

        # Step 2: Transcribe Audio
        try:
            transcription_result = self.transcriber.transcribe(audio_path)
            transcript_text = transcription_result.get("text", "")
            audio_duration = transcription_result.get("duration_seconds", 0.0)

            result["transcript"] = transcript_text
            result["metadata"]["audio_duration_seconds"] = audio_duration

            if not transcript_text.strip():
                err_msg = "TRANSCRIPTION_ERROR: Generated transcript is empty"
                errors.append(err_msg)
                result["status"] = "TRANSCRIPTION_ERROR"
                result["metadata"]["errors"] = errors
                result["metadata"]["processing_time_seconds"] = round(time.time() - start_total_time, 3)
                return result

        except Exception as e:
            err_msg = f"TRANSCRIPTION_ERROR: {str(e)}"
            errors.append(err_msg)
            result["status"] = "TRANSCRIPTION_ERROR"
            result["metadata"]["errors"] = errors
            result["metadata"]["processing_time_seconds"] = round(time.time() - start_total_time, 3)
            return result

        # Step 3: Clean Transcript for LLM Consumption
        # The raw verbatim transcript is preserved in result["transcript"]; only the
        # cleaned version is sent to the LLM to improve summary quality.
        try:
            cleaned_transcript = clean_transcript(transcript_text)
            result["clean_transcript"] = cleaned_transcript
        except Exception as e:
            errors.append(f"TRANSCRIPT_CLEAN_WARNING: {str(e)}")
            cleaned_transcript = transcript_text
            result["clean_transcript"] = cleaned_transcript

        # Step 4: Analyze Transcript via Local LLM
        raw_llm_response = ""
        try:
            prompt = build_analysis_prompt(cleaned_transcript)
            raw_llm_response = self.llm_provider.generate(prompt, system_prompt=SYSTEM_PROMPT)
        except Exception as e:
            err_msg = f"LLM_ERROR: {str(e)}"
            errors.append(err_msg)
            result["status"] = "LLM_ERROR"
            result["metadata"]["errors"] = errors
            result["metadata"]["processing_time_seconds"] = round(time.time() - start_total_time, 3)
            return result

        # Step 5: Validate Structured Output
        is_valid, validated_analysis, val_error = JSONValidator.validate_llm_response(raw_llm_response)
        
        if not is_valid:
            err_msg = f"INVALID_LLM_OUTPUT: {val_error}. Raw LLM Response: {raw_llm_response}"
            errors.append(err_msg)
            result["status"] = "INVALID_LLM_OUTPUT"
            result["metadata"]["errors"] = errors
            result["metadata"]["processing_time_seconds"] = round(time.time() - start_total_time, 3)
            return result

        # Success!
        result["status"] = "SUCCESS"
        result["analysis"] = validated_analysis
        result["metadata"]["processing_time_seconds"] = round(time.time() - start_total_time, 3)
        result["metadata"]["errors"] = errors

        return result


# Singleton helper function matching requirement interface
_default_pipeline = CallPipeline()

def process_call(audio_path: str) -> Dict[str, Any]:
    return _default_pipeline.process_call(audio_path)
