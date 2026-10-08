"use client";

import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";
import { Modal } from "@/components/ui/Modal";

export function QuitDialog({ open, onStay, onQuit }: { open: boolean; onStay: () => void; onQuit: () => void }) {
  return (
    <Modal open={open} onClose={onStay} title="Wait, don't go!" className="text-center">
      <div className="mt-2 flex justify-center">
        <Mascot mood="sad" size={110} />
      </div>
      <p className="mt-2 text-ink-500">If you quit now, you'll lose this lesson's progress.</p>
      <div className="mt-6 flex flex-col gap-3">
        <Button block onClick={onStay}>
          Keep learning
        </Button>
        <Button variant="plain" block className="!text-coral-700 hover:!bg-coral-50" onClick={onQuit}>
          End session
        </Button>
      </div>
    </Modal>
  );
}
