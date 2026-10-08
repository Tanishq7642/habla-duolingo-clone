import clsx from "clsx";
import type { ReactNode } from "react";

import { RailFooter } from "./RailFooter";
import { StickyRail } from "./StickyRail";
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
        // Scrolls with the page until its last card is in view, then stays (like Duolingo).
        <StickyRail label="Your progress" className="hidden w-[25.5rem] shrink-0 pb-6 xl:block">
          <div className="bg-surface pb-4 pt-6">
            <TopStats size="lg" />
          </div>
          <div className="space-y-6">
            {rail}
            <RailFooter />
          </div>
        </StickyRail>
      )}
    </div>
  );
}
