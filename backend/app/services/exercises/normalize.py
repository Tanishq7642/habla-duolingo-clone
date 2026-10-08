"""Answer normalisation for free-text and token answers.

Deliberately conservative: we forgive formatting (case, surrounding/duplicate
whitespace, punctuation incl. Spanish ¿ ¡) but never spelling. Missing accents
are *recognised* separately so the checker can accept with a gentle note,
matching how learners type on keyboards without dead keys.
"""

import re
import unicodedata

_PUNCT = re.compile(r"[\.,!?¿¡;:\"'“”‘’«»()\-–—…]")
_SPACES = re.compile(r"\s+")


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    text = _PUNCT.sub(" ", text.casefold())
    return _SPACES.sub(" ", text).strip()


def strip_accents(text: str) -> str:
    # ñ is a distinct letter in Spanish, not an accented n; keep it.
    text = text.replace("ñ", "\0")
    decomposed = unicodedata.normalize("NFD", text)
    stripped = "".join(c for c in decomposed if unicodedata.category(c) != "Mn")
    return unicodedata.normalize("NFC", stripped).replace("\0", "ñ")
