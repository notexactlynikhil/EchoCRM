import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ai.analysis.transcript_cleaner import clean_transcript

RAW_SAMPLE = (
    "Um, so, you know, I was like, uh, thinking about the, the property on Elm Street. "
    "It's got, um, three bedrooms, and, you know, the seller is, uh, w- willing to negotiate. "
    "Basically, I mean, we should, like, schedule a showing, right?"
)


def main():
    cleaned = clean_transcript(RAW_SAMPLE)

    print("RAW:    ", RAW_SAMPLE)
    print("CLEANED:", cleaned)

    removed_fillers = ["um", "uh", "you know", "basically", "i mean"]
    for filler in removed_fillers:
        assert not re.search(rf"\b{re.escape(filler)}\b", cleaned, re.I), \
            f"Filler not removed: {filler}"

    # Comma-delimited interjection "like" must be gone.
    assert not re.search(r"\blike\b\s*,", cleaned, re.I), "Interjection 'like' not removed"

    # False start "w- willing" and duplicated "the, the" cleaned up.
    assert "w- " not in cleaned, "Broken-word false start not removed"
    assert not re.search(r"\bthe,\s*the\b", cleaned, re.I), "Repeated word not collapsed"

    # Whitespace / punctuation normalised.
    assert "  " not in cleaned, "Double whitespace remains"
    assert " ," not in cleaned, "Space before punctuation remains"
    assert cleaned[-1] in ".!?", "Sentence not terminated"

    print("\nALL TRANSCRIPT CLEANER TESTS PASSED")


if __name__ == "__main__":
    main()
