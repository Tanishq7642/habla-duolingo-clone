import type { ReactNode } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { Mascot } from "@/components/ui/Mascot";

export const metadata = { title: "About" };

/** Target of the right-rail footer links (About, Blog, Efficacy, Careers, Investors, Terms, Privacy). */
export default function AboutPage() {
  return (
    <PageShell narrow>
      <header className="flex items-center gap-5">
        <Mascot size={110} interactive />
        <div>
          <h1 className="text-3xl font-black">About Habla</h1>
          <p className="font-semibold text-ink-500">Learn Spanish in bite-sized, game-like lessons.</p>
        </div>
      </header>

      <Section id="about" title="About">
        Habla is a Duolingo-style language course built as a full-stack demo: a Next.js app talking to a
        FastAPI backend that owns every rule: checking answers, hearts, XP, streaks and which skills are
        unlocked. Pico, our scarlet macaw mascot (pico means “beak”), keeps you company along the way.
      </Section>

      <Section id="efficacy" title="Efficacy">
        <ul className="list-disc space-y-1 pl-5">
          <li>Short lessons with immediate feedback and an explanation for every mistake.</li>
          <li>Missed exercises come back at the end of the lesson until you get them right.</li>
          <li>Smart practice revisits the exercises you&apos;ve struggled with most.</li>
          <li>Streaks, daily goals and crowns reward steady, regular practice.</li>
        </ul>
      </Section>

      <Section id="terms" title="Terms">
        This is a demo project with a single shared demo learner. There are no accounts, purchases or
        subscriptions; gems are play money, and the demo data resets every day.
      </Section>

      <Section id="privacy" title="Privacy">
        Habla doesn&apos;t ask for or store personal information. Your theme and sound preferences are saved
        only in your own browser, and the demo learner&apos;s progress is shared sample data.
      </Section>

      <div className="mt-10 space-y-3">
        <div id="blog" className="scroll-mt-20">
          <ComingSoon icon="📰" title="Blog" body="Learning tips and product updates." />
        </div>
        <div id="careers" className="scroll-mt-20">
          <ComingSoon icon="💼" title="Careers" body="Not hiring: this is a demo project." />
        </div>
        <div id="investors" className="scroll-mt-20">
          <ComingSoon icon="📈" title="Investors" body="Not applicable to this demo." />
        </div>
      </div>

      <ButtonLink href="/" className="mt-10">
        Back to learning
      </ButtonLink>
    </PageShell>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-8 scroll-mt-20">
      <h2 className="text-xl font-black">{title}</h2>
      <div className="mt-2 text-ink-700">{children}</div>
    </section>
  );
}
