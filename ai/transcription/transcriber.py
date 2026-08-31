import os
import time
from typing import Dict, Any, Optional
from ai.config.settings import settings

class AudioTranscriber:
    """
    Offline-capable Speech-to-Text transcriber using local Whisper model.
    Model initialization is cached so the model is not reloaded per request.
    """
    _model_instance = None
    _model_name = None

    @classmethod
    def get_model(cls):
        if cls._model_instance is None or cls._model_name != settings.WHISPER_MODEL_SIZE:
            try:
                from faster_whisper import WhisperModel
                cls._model_instance = WhisperModel(
                    settings.WHISPER_MODEL_SIZE,
                    device=settings.WHISPER_DEVICE,
                    compute_type=settings.WHISPER_COMPUTE_TYPE
                )
                cls._model_name = settings.WHISPER_MODEL_SIZE
            except Exception as e:
                # Fallback attempt with float32 if int8 is not supported
                try:
                    from faster_whisper import WhisperModel
                    cls._model_instance = WhisperModel(
                        settings.WHISPER_MODEL_SIZE,
                        device=settings.WHISPER_DEVICE,
                        compute_type="float32"
                    )
                    cls._model_name = settings.WHISPER_MODEL_SIZE
                except Exception as inner_e:
                    raise RuntimeError(f"Failed to initialize Whisper model: {str(e)} | Fallback error: {str(inner_e)}")
        return cls._model_instance

    def validate_audio_file(self, audio_path: str) -> None:
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        ext = os.path.splitext(audio_path)[1].lower()
        if ext not in settings.SUPPORTED_AUDIO_EXTENSIONS:
            raise ValueError(f"Unsupported audio format '{ext}'. Supported formats: {', '.join(settings.SUPPORTED_AUDIO_EXTENSIONS)}")

        if os.path.getsize(audio_path) == 0:
            raise ValueError(f"Audio file is empty: {audio_path}")

    def transcribe(self, audio_path: str) -> Dict[str, Any]:
        """
        Transcribes local audio file to plain text transcript.
        
        Returns:
            dict containing:
                - text: plain text transcript
                - duration_seconds: audio duration
                - processing_time: transcription compute time
                - language: detected language
                - segments: detailed list of timestamps and text segments
        """
        self.validate_audio_file(audio_path)

        start_time = time.time()
        model = self.get_model()

        try:
            segments_raw, info = model.transcribe(audio_path, beam_size=5)
            
            segments = []
            full_text_list = []

            for seg in segments_raw:
                segments.append({
                    "start": round(seg.start, 2),
                    "end": round(seg.end, 2),
                    "text": seg.text.strip()
                })
                full_text_list.append(seg.text.strip())

            full_text = " ".join(full_text_list)
            processing_time = round(time.time() - start_time, 3)

            return {
                "text": full_text,
                "duration_seconds": round(info.duration, 2) if hasattr(info, 'duration') else 0.0,
                "language": getattr(info, 'language', 'en'),
                "processing_time": processing_time,
                "segments": segments
            }
        except Exception as e:
            raise RuntimeError(f"Transcription failed for file {audio_path}: {str(e)}")

# Singleton helper function matching requirement interface
_default_transcriber = AudioTranscriber()

def transcribe(audio_path: str) -> Dict[str, Any]:
    return _default_transcriber.transcribe(audio_path)
