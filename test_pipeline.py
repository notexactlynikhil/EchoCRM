import sys
import os
import json
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from ai.config.settings import settings
from ai.transcription.transcriber import AudioTranscriber
from ai.analysis.llm_provider import get_llm_provider
from ai.analysis.prompts import SYSTEM_PROMPT, build_analysis_prompt
from ai.analysis.validator import JSONValidator
from ai.pipeline.orchestrator import CallPipeline

def main():
    # 1. Parse Audio Path Argument
    if len(sys.argv) > 1:
        audio_input = sys.argv[1]
    else:
        audio_input = os.path.join("test", "sample-audio", "sample.wav")

    # Resolve audio path if user passed a relative filename in test/sample-audio
    if not os.path.exists(audio_input):
        alt_path = os.path.join("test", "sample-audio", audio_input)
        if os.path.exists(alt_path):
            audio_input = alt_path

    print("====================================")
    print("WAVELENGTH AI PIPELINE")
    print("====================================\n")
    print(f"Audio:\n{audio_input}\n")

    # Step 1: Transcribe
    print("[1/3] Transcribing...")
    transcriber = AudioTranscriber()
    
    try:
        transcription_res = transcriber.transcribe(audio_input)
        transcript = transcription_res.get("text", "")
        print("✓ Transcription complete\n")
    except Exception as e:
        print(f"✗ Transcription failed: {str(e)}")
        sys.exit(1)

    # Step 2: Analyze
    print("[2/3] Analyzing transcript...")
    llm_provider = get_llm_provider()
    prompt = build_analysis_prompt(transcript)
    
    try:
        raw_llm = llm_provider.generate(prompt, system_prompt=SYSTEM_PROMPT)
        print("✓ LLM analysis complete\n")
    except Exception as e:
        print(f"✗ LLM analysis failed: {str(e)}")
        sys.exit(1)

    # Step 3: Validate Structured Output
    print("[3/3] Validating structured output...")
    is_valid, analysis_result, err = JSONValidator.validate_llm_response(raw_llm)
    
    if is_valid:
        print("✓ JSON validation successful\n")
    else:
        print(f"✗ JSON validation failed: {err}")
        sys.exit(1)

    # Build Complete Pipeline Output Payload
    pipeline = CallPipeline(transcriber=transcriber, llm_provider=llm_provider)
    full_result = pipeline.process_call(audio_input)

    # Console Output Print
    print("====================================")
    print("TRANSCRIPT")
    print("====================================\n")
    print(f"{transcript}\n")

    print("====================================")
    print("AI ANALYSIS")
    print("====================================\n")
    print(json.dumps(analysis_result, indent=4))
    print("\n====================================")
    print("PIPELINE COMPLETE")
    print("====================================\n")

    # Save output to test/output/result.json
    output_dir = os.path.join("test", "output")
    os.makedirs(output_dir, exist_ok=True)
    result_path = os.path.join(output_dir, "result.json")
    
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(full_result, f, indent=4)

    print(f"Result saved to: {result_path}")

if __name__ == "__main__":
    main()
