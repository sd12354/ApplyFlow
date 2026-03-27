"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Sparkles, Mail, LayoutDashboard } from "lucide-react";

function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={[
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className ?? "",
      ].join(" ")}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

export function LandingClient() {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <Reveal className="px-6 pb-10 pt-10 md:px-10 md:pb-16 md:pt-14">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-zinc-200 bg-white/70 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 via-cyan-400/30 to-indigo-500/30 animate-pulse" />
              <Sparkles className="relative h-5 w-5 text-zinc-900 dark:text-zinc-50" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">ApplyFlow</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                From inbox to pipeline
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-3 sm:flex">
            <Link
              href="/accounts"
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900/40 dark:hover:text-zinc-50"
            >
              Connect inbox
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900/40 dark:hover:text-zinc-50"
            >
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-50 dark:hover:bg-zinc-950/90"
            >
              <Mail className="mr-2 h-4 w-4" />
              Get started
            </Link>
          </div>
        </header>
      </Reveal>

      <main className="flex-1 px-6 pb-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal delayMs={80}>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/60 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Automatically classify application emails
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">
                Turn your inbox into a job application pipeline.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                ApplyFlow connects Gmail, finds the emails that matter, and
                organizes them into a Kanban board: Applied, Interview,
                Rejected, Offer.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/api/auth/signin/google?callbackUrl=/dashboard"
                  className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Login with Google
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white/70 px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/90"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Open dashboard
                </Link>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Reveal delayMs={160} className="rounded-xl border border-zinc-200 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <span className="text-sm font-bold">A</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Fast keyword matching</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        “thank you for applying”, “interview”, “we regret…”
                      </div>
                    </div>
                  </div>
                </Reveal>
                <Reveal delayMs={220} className="rounded-xl border border-zinc-200 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      <span className="text-sm font-bold">K</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Drag & edit</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Move cards between stages and refine roles.
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </Reveal>

            <Reveal delayMs={120}>
              <div className="relative">
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-indigo-500/20 blur-2xl" />
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white/60 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        Your pipeline (example)
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Live updates
                      </div>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      {[
                        { title: "Applied", count: 2, color: "bg-emerald-500/10" },
                        { title: "Interview", count: 1, color: "bg-cyan-500/10" },
                        { title: "Rejected", count: 1, color: "bg-rose-500/10" },
                        { title: "Offer", count: 0, color: "bg-indigo-500/10" },
                      ].map((col) => (
                        <div
                          key={col.title}
                          className="rounded-xl border border-zinc-200 bg-white/40 p-3 dark:border-zinc-800"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                              {col.title}
                            </div>
                            <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
                              {col.count}
                            </div>
                          </div>
                          <div className="mt-3 space-y-2">
                            <div
                              className={[
                                "rounded-lg border border-zinc-200 bg-white/70 px-2 py-2 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-900/30",
                                col.color,
                              ].join(" ")}
                            >
                              <div className="font-medium text-zinc-800 dark:text-zinc-100">
                                {col.title === "Applied"
                                  ? "Product Designer"
                                  : col.title === "Interview"
                                    ? "Frontend Engineer"
                                    : col.title === "Rejected"
                                      ? "Not moving forward"
                                      : "Offer received"}
                              </div>
                              <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                                Auto-classified
                              </div>
                            </div>
                            {col.count > 1 ? (
                              <div className="rounded-lg border border-zinc-200 bg-white/70 px-2 py-2 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-900/30">
                                <div className="font-medium text-zinc-800 dark:text-zinc-100">
                                  Software Engineer
                                </div>
                                <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                                  Auto-classified
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </main>

      <footer className="px-6 pb-10 md:px-10">
        <Reveal delayMs={180}>
          <div className="mx-auto max-w-6xl rounded-2xl border border-zinc-200 bg-white/60 px-6 py-5 text-sm text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200">
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              ApplyFlow
            </span>{" "}
            keeps your job search organized automatically from your inbox.
            Connect your inbox and let the pipeline update for you.
          </div>
        </Reveal>
      </footer>
    </div>
  );
}

