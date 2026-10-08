"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Mascot } from "@/components/ui/Mascot";

import { LeaderboardIcon, LearnIcon, MoreIcon, ProfileIcon, QuestsIcon, ShopIcon } from "./NavIcons";

// Same sections as Duolingo's web sidebar. `mobile: false` items live elsewhere on phones
// (Settings is reachable from the Profile header) to keep the tab bar at 5 targets.
const NAV = [
  { href: "/", label: "Learn", Icon: LearnIcon, mobile: true },
  { href: "/leaderboard", label: "Leaderboards", Icon: LeaderboardIcon, mobile: true },
  { href: "/quests", label: "Quests", Icon: QuestsIcon, mobile: true },
  { href: "/shop", label: "Shop", Icon: ShopIcon, mobile: true },
  { href: "/profile", label: "Profile", Icon: ProfileIcon, mobile: true },
  { href: "/settings", label: "More", Icon: MoreIcon, mobile: false },
] as const;

function useIsActive() {
  const pathname = usePathname();
  // The units overview (/sections) belongs to Learn, as in Duolingo.
  return (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/sections") : pathname.startsWith(href));
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-xl px-2" aria-label="Habla home">
      <Mascot size={40} />
      {/* Logotype: brand colour on purpose (WCAG exempts logos). */}
      <span className="text-[2.1rem] font-black tracking-tight text-leaf-500">habla</span>
    </Link>
  );
}

/** Desktop / tablet-landscape left rail. */
export function Sidebar() {
  const isActive = useIsActive();
  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-[17.75rem] shrink-0 flex-col gap-8 border-r-2 border-ink-200 px-4 pt-8 lg:flex">
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
                "flex min-h-[3.6rem] items-center gap-5 rounded-xl border-2 px-4 py-2 text-[1.05rem] font-extrabold uppercase tracking-[0.05em] transition",
                // Duolingo: active = bright blue label on light blue with a blue outline; others are grey
                active ? "border-ocean-200 bg-ocean-50 text-ocean-500" : "border-transparent text-wolf hover:bg-ink-50",
              )}
            >
              <item.Icon size={36} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

/** Phone / tablet-portrait bottom tab bar – thumbs live at the bottom. */
export function MobileNav() {
  const isActive = useIsActive();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-ink-100 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
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
                "flex h-10 w-12 items-center justify-center rounded-xl border-2 transition",
                active ? "border-ocean-400 bg-ocean-50" : "border-transparent",
              )}
              aria-hidden
            >
              <item.Icon size={28} />
            </span>
            <span className={clsx("max-w-full truncate text-[0.625rem] font-extrabold", active ? "text-ocean-800" : "text-ink-500")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
