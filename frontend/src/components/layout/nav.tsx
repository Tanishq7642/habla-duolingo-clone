"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DemoLearnerCard } from "./DemoLearnerCard";

// Same sections as Duolingo's web sidebar. `mobile: false` items live elsewhere on phones
// (Settings is reachable from the Profile header) to keep the tab bar at 5 targets.
const NAV = [
  { href: "/", label: "Learn", icon: "🏠", mobile: true },
  { href: "/leaderboard", label: "Leaderboards", icon: "🏆", mobile: true },
  { href: "/quests", label: "Quests", icon: "🎯", mobile: true },
  { href: "/shop", label: "Shop", icon: "🛍️", mobile: true },
  { href: "/profile", label: "Profile", icon: "🙂", mobile: true },
  { href: "/settings", label: "More", icon: "⚙️", mobile: false },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-xl px-2" aria-label="Habla home">
      {/* Logotype: brand colour on purpose (WCAG exempts logos). */}
      <span className="text-3xl font-black tracking-tight text-leaf-500" data-brand-surface>habla</span>
    </Link>
  );
}

/** Desktop / tablet-landscape left rail. */
export function Sidebar() {
  const isActive = useIsActive();
  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col gap-6 border-r-2 border-ink-100 px-4 py-7 lg:flex">
      <Logo />
      <nav aria-label="Main" className="flex flex-col gap-2">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex items-center gap-4 rounded-2xl border-2 px-4 py-3 text-sm font-extrabold uppercase tracking-wide transition",
                active ? "border-ocean-400 bg-ocean-50 text-ocean-800" : "border-transparent text-ink-500 hover:bg-ink-50",
              )}
            >
              <span className="text-2xl" aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <DemoLearnerCard />
    </aside>
  );
}

/** Phone / tablet-portrait bottom tab bar – thumbs live at the bottom. */
export function MobileNav() {
  const isActive = useIsActive();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {NAV.filter((item) => item.mobile).map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2"
          >
            <span
              className={clsx(
                "flex h-10 w-12 items-center justify-center rounded-xl border-2 text-2xl transition",
                active ? "border-ocean-400 bg-ocean-50" : "border-transparent",
              )}
              aria-hidden
            >
              {item.icon}
            </span>
            <span className={clsx("max-w-full truncate text-[10px] font-extrabold", active ? "text-ocean-800" : "text-ink-500")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
