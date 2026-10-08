"""Tiny DSL for authoring exercises readably.

Each builder returns a dict matching an `exercises` row (type, prompt, data,
solution, explanation, xp). Option/tile ids are generated and shuffled with a
seeded RNG, so the seed is deterministic and the correct option isn't always
first.
"""

import random
import string

# Recognition tasks (pick / match) vs. production tasks (build / type) –
# producing language is harder, so it's worth a little more XP.
XP_RECOGNITION = 5
XP_PRODUCTION = 7

_rng = random.Random(1337)


def _ids(n: int) -> list[str]:
    return list(string.ascii_lowercase[:n])


def _shuffled(items: list) -> list:
    items = list(items)
    _rng.shuffle(items)
    return items


def _choices(options: list[str], answer: str, emojis: dict[str, str] | None = None):
    assert answer in options, f"{answer!r} not in {options}"
    shuffled = _shuffled(options)
    choices = [{"id": i, "text": t, **({"emoji": emojis[t]} if emojis and t in emojis else {})}
               for i, t in zip(_ids(len(shuffled)), shuffled)]
    answer_id = next(c["id"] for c in choices if c["text"] == answer)
    return choices, answer_id


def mc(prompt: str, options: list[str], answer: str, explanation: str, emojis: dict[str, str] | None = None):
    choices, answer_id = _choices(options, answer, emojis)
    return dict(type="multiple_choice", prompt=prompt, data={"options": choices},
                solution={"option_id": answer_id}, explanation=explanation, xp=XP_RECOGNITION)


def fill(sentence: str, options: list[str], answer: str, translation: str, explanation: str):
    before, after = sentence.split("___")
    choices, answer_id = _choices(options, answer)
    return dict(type="fill_blank", prompt="Fill in the blank",
                data={"before": before.strip(), "after": after.strip(), "translation": translation,
                      "options": choices},
                solution={"option_id": answer_id}, explanation=explanation, xp=XP_RECOGNITION)


def bank(source: str, answer: str, distractors: list[str], explanation: str, also: list[str] = ()):
    accepted = [answer.split()] + [a.split() for a in also]
    # Enough tiles to build every accepted sentence, plus distractors.
    needed: list[str] = []
    for sentence in accepted:
        pool = list(needed)
        for word in sentence:
            if word in pool:
                pool.remove(word)
            else:
                needed.append(word)
    words = _shuffled(needed + distractors)
    tiles = [{"id": f"t{i}", "text": w} for i, w in enumerate(words)]
    return dict(type="word_bank", prompt="Translate this sentence",
                data={"source_text": source, "tiles": tiles},
                solution={"accepted": accepted}, explanation=explanation, xp=XP_PRODUCTION)


def match(pairs: list[tuple[str, str]], explanation: str = "Each Spanish word pairs with its English meaning."):
    left = _shuffled([{"id": f"l{i}", "text": es} for i, (es, _) in enumerate(pairs)])
    right_ids = {en: f"r{i}" for i, (_, en) in enumerate(pairs)}
    solution = {f"l{i}": right_ids[en] for i, (_, en) in enumerate(pairs)}
    right = [{"id": rid, "text": en} for en, rid in right_ids.items()]
    # No word may sit directly across from its partner, or the board solves itself.
    while any(solution[l["id"]] == r["id"] for l, r in zip(left, right)):
        right = _shuffled(right)
    return dict(type="match_pairs", prompt="Tap the matching pairs",
                data={"left": left, "right": right},
                solution={"pairs": solution}, explanation=explanation, xp=XP_RECOGNITION)


def typed(prompt: str, accepted: list[str], explanation: str, source: str | None = None,
          answer_language: str = "es"):
    return dict(type="type_answer", prompt=prompt,
                data={"source_text": source, "placeholder": "Type in Spanish" if answer_language == "es"
                      else "Type in English", "answer_language": answer_language},
                solution={"accepted": accepted}, explanation=explanation, xp=XP_PRODUCTION)
