import { MobileNav, Sidebar } from "@/components/layout/nav";
import { TimezoneSync } from "@/components/layout/TimezoneSync";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <div className="min-w-0 flex-1">{children}</div>
      <MobileNav />
      <TimezoneSync />
    </div>
  );
}
