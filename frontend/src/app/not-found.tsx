import { ButtonLink } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      <Mascot mood="think" size={130} interactive />
      <h1 className="text-3xl font-black">Page not found</h1>
      <p className="text-ink-500">Pico looked everywhere, but this page doesn't exist. Maybe the lesson moved?</p>
      <ButtonLink href="/">Back to learning</ButtonLink>
    </div>
  );
}
