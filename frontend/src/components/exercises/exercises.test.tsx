import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { AnswerMap, AnswerResult, Exercise, ExerciseType } from "@/lib/types";

import { MatchPairs } from "./MatchPairs";
import { exerciseRegistry } from "./registry";
import { WordBank } from "./WordBank";

/** Renders an exercise as the LessonPlayer would: controlled, with the draft lifted up. */
function Harness<T extends ExerciseType>({
  Component,
  exercise,
  onDraft,
  result = null,
}: {
  Component: React.ComponentType<{ exercise: Exercise<T>; value: AnswerMap[T] | null; onChange: (v: AnswerMap[T] | null) => void; locked: boolean; result: AnswerResult | null }>;
  exercise: Exercise<T>;
  onDraft: (d: AnswerMap[T] | null) => void;
  result?: AnswerResult | null;
}) {
  const [draft, setDraft] = useState<AnswerMap[T] | null>(null);
  return (
    <Component
      exercise={exercise}
      value={draft}
      locked={!!result}
      result={result}
      onChange={(d) => {
        setDraft(d);
        onDraft(d);
      }}
    />
  );
}

const wordBank: Exercise<"word_bank"> = {
  id: 1,
  type: "word_bank",
  prompt: "Translate this sentence",
  xp: 7,
  data: {
    source_text: "I drink water.",
    tiles: [
      { id: "t0", text: "agua" },
      { id: "t1", text: "Yo" },
      { id: "t2", text: "bebo" },
      { id: "t3", text: "agua" }, // duplicate text, distinct tile
    ],
  },
};

const matchPairs: Exercise<"match_pairs"> = {
  id: 2,
  type: "match_pairs",
  prompt: "Tap the matching pairs",
  xp: 5,
  data: {
    left: [{ id: "l0", text: "perro" }, { id: "l1", text: "gato" }],
    right: [{ id: "r1", text: "cat" }, { id: "r0", text: "dog" }],
  },
};

describe("WordBank", () => {
  it("builds the answer in tap order and lets tiles be removed", async () => {
    const user = userEvent.setup();
    const onDraft = vi.fn();
    render(<Harness Component={WordBank} exercise={wordBank} onDraft={onDraft} />);

    await user.click(screen.getByRole("button", { name: "Add Yo" }));
    await user.click(screen.getByRole("button", { name: "Add bebo" }));
    await user.click(screen.getAllByRole("button", { name: "Add agua" })[0]);
    expect(onDraft).toHaveBeenLastCalledWith({ tile_ids: ["t1", "t2", "t0"] });

    // A used tile can't be added twice, but its twin still can.
    expect(screen.getByRole("button", { name: "agua (used)" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add agua" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Remove bebo" }));
    expect(onDraft).toHaveBeenLastCalledWith({ tile_ids: ["t1", "t0"] });
  });

  it("reset clears the answer back to 'not ready'", async () => {
    const user = userEvent.setup();
    const onDraft = vi.fn();
    render(<Harness Component={WordBank} exercise={wordBank} onDraft={onDraft} />);
    await user.click(screen.getByRole("button", { name: "Add Yo" }));
    await user.click(screen.getByRole("button", { name: /reset/i }));
    expect(onDraft).toHaveBeenLastCalledWith(null);
    expect(exerciseRegistry.word_bank.isReady(null, wordBank.data)).toBe(false);
  });
});

describe("MatchPairs", () => {
  it("pairs a word from each side, unpairs on tap, and is ready only when the board is full", async () => {
    const user = userEvent.setup();
    const onDraft = vi.fn();
    render(<Harness Component={MatchPairs} exercise={matchPairs} onDraft={onDraft} />);

    await user.click(screen.getByRole("button", { name: "perro" }));
    await user.click(screen.getByRole("button", { name: "dog" }));
    expect(onDraft).toHaveBeenLastCalledWith({ pairs: { l0: "r0" } });
    expect(exerciseRegistry.match_pairs.isReady({ pairs: { l0: "r0" } }, matchPairs.data)).toBe(false);

    // Right-then-left order works too.
    await user.click(screen.getByRole("button", { name: "cat" }));
    await user.click(screen.getByRole("button", { name: "gato" }));
    const full = { pairs: { l0: "r0", l1: "r1" } };
    expect(onDraft).toHaveBeenLastCalledWith(full);
    expect(exerciseRegistry.match_pairs.isReady(full, matchPairs.data)).toBe(true);

    await user.click(screen.getByRole("button", { name: /perro, pair 1/ }));
    expect(onDraft).toHaveBeenLastCalledWith({ pairs: { l1: "r1" } });
  });

  it("marks only the wrong pairs after server feedback", () => {
    const feedback = { correct: false, detail: { wrong_left_ids: ["l0"] } } as AnswerResult;
    function Checked() {
      return (
        <MatchPairs exercise={matchPairs} value={{ pairs: { l0: "r1", l1: "r0" } }} onChange={() => {}} locked result={feedback} />
      );
    }
    render(<Checked />);
    expect(screen.getByRole("button", { name: /perro/ }).className).toMatch(/coral/);
    expect(screen.getByRole("button", { name: /gato/ }).className).toMatch(/leaf/);
  });
});

describe("exercise registry", () => {
  it("has a renderer and readiness rule for every exercise type", () => {
    for (const def of Object.values(exerciseRegistry)) {
      expect(def.Component).toBeTypeOf("function");
      expect(def.isReady(null, {} as never)).toBe(false);
    }
  });

  it("does not treat whitespace as a typed answer", () => {
    expect(exerciseRegistry.type_answer.isReady({ text: "   " }, {} as never)).toBe(false);
    expect(exerciseRegistry.type_answer.isReady({ text: "hola" }, {} as never)).toBe(true);
  });
});
