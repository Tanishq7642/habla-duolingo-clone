import Link from "next/link";

// Same set and order as Duolingo's right-column footer; each goes to a real section of /about.
const LINKS = [
  ["About", "/about#about"],
  ["Blog", "/about#blog"],
  ["Store", "/shop"],
  ["Efficacy", "/about#efficacy"],
  ["Careers", "/about#careers"],
  ["Investors", "/about#investors"],
  ["Terms", "/about#terms"],
  ["Privacy", "/about#privacy"],
] as const;

export function RailFooter() {
  return (
    <footer className="px-2 pt-2">
      <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        {LINKS.map(([label, href]) => (
          <Link key={label} href={href} className="text-sm font-extrabold uppercase tracking-wide text-ink-400 transition hover:text-ink-500">
            {label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
