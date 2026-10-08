"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { UnitNode } from "@/lib/types";

const STATUS_LABEL = { locked: "Locked", available: "Ready", completed: "Done" } as const;

/** Duolingo-style unit guidebook: what this unit covers, skill by skill (from the course data). */
export function GuidebookModal({ unit, open, onClose }: { unit: UnitNode; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={`Unit ${unit.position} guidebook`} className="max-w-lg">
      <p className="mt-1 text-ink-500">
        <span className="font-extrabold text-ink-700">{unit.title}:</span> {unit.description}
      </p>
      <ul className="mt-5 max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {unit.skills.map((skill) => (
          <li key={skill.id} className="rounded-2xl border-2 border-ink-200 p-4">
            <p className="flex items-center gap-2 text-lg font-black text-ink-900">
              <span aria-hidden>{skill.icon}</span> {skill.title}
            </p>
            <p className="text-sm text-ink-500">{skill.description}</p>
            <ol className="mt-3 space-y-1">
              {skill.lessons.map((l) => (
                <li key={l.id} className="flex items-center justify-between text-sm">
                  <span className="font-bold text-ink-700">
                    Lesson {l.position}: {l.title}
                  </span>
                  <span className={l.status === "completed" ? "font-black text-leaf-800" : "font-bold text-ink-500"}>
                    {l.status === "completed" ? "✓ " : ""}
                    {STATUS_LABEL[l.status]}
                  </span>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
      <Button block className="mt-5" onClick={onClose}>
        Got it
      </Button>
    </Modal>
  );
}
