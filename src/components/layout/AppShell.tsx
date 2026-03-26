import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
              {subtitle ? (
                <p className="text-xs text-zinc-500">{subtitle}</p>
              ) : null}
            </div>

            <Link
              href="/"
              className="rounded-md border border-zinc-200 bg-white/70 px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-50 dark:hover:bg-zinc-950"
            >
              Home
            </Link>
          </header>

          <section className="flex-1 overflow-auto bg-gradient-to-b from-zinc-50 to-zinc-100 px-6 py-6 dark:from-zinc-950 dark:to-zinc-900">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}

