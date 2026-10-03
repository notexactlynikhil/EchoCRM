"""
Lightweight, rule-based transcript cleaner.

Produces an LLM-facing version of a raw Whisper transcript with filler words,
hesitations, false starts and duplicated words removed, and whitespace /
punctuation normalised. No additional ML model is used.

The original verbatim transcript is always preserved separately; only the
cleaned text is fed to the summarization prompt.
"""

import re

# Hesitation sounds that carry no semantic content. An optional leading comma is
# consumed so removals do not leave dangling punctuation (e.g. "got, um, three").
_HESITATION_PATTERN = re.compile(
    r"(?i)(?:,\s*)?\b(?:um+|uh+|erm+|hmm+|mhm+|mm+|ah+)\b[,.!?;:]*\s*"
)

# Discourse markers safe to remove wherever they appear.
_ALWAYS_REMOVABLE = [
    "you know",
    "i mean",
    "sort of",
    "kind of",
    "more or less",
    "basically",
    "actually",
    "literally",
    "honestly",
    "obviously",
    "essentially",
    "to be honest",
]

# Words that are only fillers when used as an interjection (comma delimited).
_INTERJECTIONS = ["like", "well", "so", "right", "okay", "ok", "anyway", "anyways"]


def _remove_hesitations(text: str) -> str:
    return _HESITATION_PATTERN.sub(" ", text)


def _remove_always_removable(text: str) -> str:
    for phrase in _ALWAYS_REMOVABLE:
        text = re.sub(
            rf"(?i)(?:,\s*)?\b{re.escape(phrase)}\b(?:,\s*)?",
            " ",
            text,
        )
    return text


def _remove_interjections(text: str) -> str:
    for word in _INTERJECTIONS:
        # ", like," -> " "
        text = re.sub(rf"(?i)(?:,\s*)\b{re.escape(word)}\b\s*,?", " ", text)
        # "like, " -> " "
        text = re.sub(rf"(?i)\b{re.escape(word)}\b\s*,\s*", " ", text)
    return text


def _remove_false_starts(text: str) -> str:
    # Broken word false start, e.g. "w- we should" -> "we should"
    text = re.sub(r"\b\w{1,4}-\s+(?=[A-Za-z])", "", text)
    # Immediate word repetition, e.g. "the the", "I I" -> single word
    text = re.sub(r"(?i)\b(\w+)(?:\s+\1\b)+", r"\1", text)
    # Comma-separated repetition, e.g. "the, the property" -> "the property"
    text = re.sub(r"(?i)\b(\w+)\s*,\s*\1\b", r"\1", text)
    return text


def _normalize(text: str) -> str:
    # Curly quotes / apostrophes to plain equivalents
    text = text.replace("\u2019", "'").replace("\u2018", "'")
    text = text.replace("\u201c", '"').replace("\u201d", '"')
    # No space before punctuation
    text = re.sub(r"\s+([,.!?;:])", r"\1", text)
    # Exactly one space after punctuation
    text = re.sub(r"([,.!?;:])(?=[^\s\d])", r"\1 ", text)
    # Collapse repeated punctuation and whitespace
    text = re.sub(r"([,.!?;:])\1+", r"\1", text)
    text = re.sub(r"\s+", " ", text).strip()
    # Capitalise the start of every sentence
    text = re.sub(r"(^|[.!?]\s+)([a-z])", lambda m: m.group(1) + m.group(2).upper(), text)
    if text and text[-1] not in ".!?":
        text += "."
    return text


def clean_transcript(raw_text: str) -> str:
    """Return an LLM-facing cleaned version of ``raw_text``."""
    if not raw_text or not raw_text.strip():
        return ""

    cleaned = raw_text
    cleaned = _remove_false_starts(cleaned)
    # Interjections are comma-delimited, so remove them before hesitations strip
    # the commas that make them detectable.
    cleaned = _remove_interjections(cleaned)
    cleaned = _remove_always_removable(cleaned)
    cleaned = _remove_hesitations(cleaned)
    cleaned = _normalize(cleaned)
    return cleaned
