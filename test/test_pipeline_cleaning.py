import json
import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ai.pipeline.orchestrator import CallPipeline

FILLED_TRANSCRIPT = (
    "Um, so, you know, the client said the, the budget is, uh, around five hundred thousand. "
    "Like, they want to, um, see the Elm Street listing, right?"
)

VALID_LLM_JSON = json.dumps({
    "summary": "Client discussed budget and requested a showing.",
    "sentiment": "positive",
    "deal_stage": "prospecting",
    "customer_intent": "View the Elm Street listing.",
    "products_discussed": ["Elm Street Listing"],
    "action_items": [{"description": "Schedule a showing", "due_date": None}],
    "follow_up": {"required": True, "date": None, "reason": "Client requested a viewing."},
})


class FakeTranscriber:
    def validate_audio_file(self, audio_path):
        return None

    def transcribe(self, audio_path):
        return {
            "text": FILLED_TRANSCRIPT,
            "duration_seconds": 42.0,
            "language": "en",
            "segments": [],
        }


class FakeLLM:
    def __init__(self):
        self.last_prompt = None

    def get_provider_name(self):
        return "fake"

    def get_model_name(self):
        return "fake-model"

    def generate(self, prompt, system_prompt=None):
        self.last_prompt = prompt
        return VALID_LLM_JSON


def main():
    llm = FakeLLM()
    pipeline = CallPipeline(transcriber=FakeTranscriber(), llm_provider=llm)
    result = pipeline.process_call("fake.webm")

    assert result["status"] == "SUCCESS", result
    assert result["transcript"] == FILLED_TRANSCRIPT, "Raw transcript must be preserved verbatim"
    assert result["clean_transcript"], "clean_transcript must be populated"
    assert result["clean_transcript"] != result["transcript"], "Cleaned transcript must differ from raw"

    # Fillers are gone from the cleaned version but remain in the raw version.
    for filler in ["um", "uh", "you know"]:
        assert re.search(rf"\b{filler}\b", result["transcript"], re.I), \
            f"Raw transcript unexpectedly lost filler: {filler}"
        assert not re.search(rf"\b{filler}\b", result["clean_transcript"], re.I), \
            f"Cleaned transcript still contains filler: {filler}"

    # The LLM prompt must be built from the cleaned transcript, not the raw one.
    assert result["clean_transcript"] in llm.last_prompt, "LLM prompt should contain cleaned transcript"
    assert FILLED_TRANSCRIPT not in llm.last_prompt, "LLM prompt must not contain raw transcript"

    print("RAW:    ", result["transcript"])
    print("CLEANED:", result["clean_transcript"])
    print("\nPIPELINE CLEANING INTEGRATION TEST PASSED")


if __name__ == "__main__":
    main()
