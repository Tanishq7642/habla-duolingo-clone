import clsx from "clsx";
import type { ReactNode } from "react";

import { TopStats } from "./TopStats";

/**
 * Page frame for the main app: centred content column plus an optional right
 * rail on wide screens. Below `xl` the stats bar sits sticky above content.
 */
export function PageShell({ children, rail, narrow }: { children: ReactNode; rail?: ReactNode; narrow?: boolean }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl gap-10 px-4 sm:px-6">
      <main className={clsx("mx-auto w-full min-w-0 flex-1 pb-28 lg:pb-12", narrow ? "max-w-2xl" : "max-w-xl")}>
        <div className="sticky top-0 z-30 -mx-4 mb-4 border-b-2 border-ink-100 bg-surface/95 px-3 py-2 backdrop-blur sm:-mx-6 sm:px-5 xl:hidden">
          <TopStats />
        </div>
        <div className="xl:pt-8">{children}</div>
      </main>
      {rail && (
        <aside className="sticky top-0 hidden h-[100dvh] w-[25.5rem] shrink-0 space-y-6 overflow-y-auto overflow-x-hidden py-6 xl:block" aria-label="Your progress">
          <TopStats size="lg" />
          {rail}
        </aside>
      )}
    </div>
  );
}
