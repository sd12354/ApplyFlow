"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

type ColumnId = "applied" | "interview" | "rejected" | "offer";

const columns: { id: ColumnId; title: string }[] = [
  { id: "applied", title: "Applied" },
  { id: "interview", title: "Interview" },
  { id: "rejected", title: "Rejected" },
  { id: "offer", title: "Offer" },
];

type ApplicationCard = {
  id: string;
  company: string;
  role: string;
  status: ColumnId;
};

type ApiApplication = {
  id: string;
  company: string;
  role: string;
  status: string;
};

function normalizeStatus(status: string): ColumnId {
  const s = status.toLowerCase();
  if (s === "applied") return "applied";
  if (s === "interview") return "interview";
  if (s === "rejected") return "rejected";
  return "offer";
}

function DashboardBoard() {
  const [cards, setCards] = useState<ApplicationCard[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadApplications = async () => {
    const res = await fetch("/api/applications");
    if (!res.ok) return;
    const data = (await res.json()) as ApiApplication[];
    const mapped: ApplicationCard[] = data.map((item) => ({
      id: item.id,
      company: item.company,
      role: item.role,
      status: normalizeStatus(item.status),
    }));
    setCards(mapped);
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  const handleDrop = (columnId: ColumnId) => {
    if (!draggingId) return;
    setCards((prev) => {
      const next = prev.map((card) =>
        card.id === draggingId ? { ...card, status: columnId } : card,
      );
      const moved = next.find((c) => c.id === draggingId);
      if (moved) {
        void fetch("/api/applications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: moved.id,
            status: columnId.toUpperCase(),
          }),
        });
      }
      return next;
    });
    setDraggingId(null);
  };

  const handleTitleEdit = (id: string, company: string) => {
    setCards((prev) => {
      const next = prev.map((card) =>
        card.id === id ? { ...card, company } : card,
      );
      const updated = next.find((c) => c.id === id);
      if (updated) {
        void fetch("/api/applications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: updated.id,
            company: updated.company,
          }),
        });
      }
      return next;
    });
  };

  const handleRoleEdit = (id: string, role: string) => {
    setCards((prev) => {
      const next = prev.map((card) => (card.id === id ? { ...card, role } : card));
      const updated = next.find((c) => c.id === id);
      if (updated) {
        void fetch("/api/applications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: updated.id,
            role: updated.role,
          }),
        });
      }
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Application pipeline
          </h2>
          <p className="text-xs text-zinc-500">
            Emails are synced from your connected inboxes and classified into
            stages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true);
              try {
                await fetch("/api/sync-emails", { method: "POST" });
                await loadApplications();
              } finally {
                setSyncing(false);
              }
            }}
          >
            {syncing ? "Syncing..." : "Sync emails"}
          </Button>
          <Button size="sm">New application</Button>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-4">
        {columns.map((column) => {
          const columnCards = cards.filter((card) => card.status === column.id);
          return (
            <section
              key={column.id}
              className="flex flex-col rounded-xl border border-zinc-200 bg-white/80 p-3 text-sm shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(column.id)}
            >
              <header className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    {column.title}
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-400">
                  {columnCards.length}
                </span>
              </header>
              <div className="flex-1 space-y-2 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 p-2 text-xs dark:border-zinc-800 dark:bg-zinc-900/40">
                {columnCards.length === 0 ? (
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Drag applications here to move them into {column.title}.
                  </p>
                ) : (
                  columnCards.map((card) => (
                    <article
                      key={card.id}
                      draggable
                      onDragStart={() => setDraggingId(card.id)}
                      className="cursor-grab rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <input
                        className="w-full bg-transparent text-[11px] font-medium text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
                        value={card.company}
                        onChange={(e) => handleTitleEdit(card.id, e.target.value)}
                      />
                      <input
                        className="mt-0.5 w-full bg-transparent text-[10px] text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                        value={card.role}
                        onChange={(e) => handleRoleEdit(card.id, e.target.value)}
                      />
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { status } = useSession();

  if (status === "loading") {
    return <div className="text-sm text-zinc-500">Loading…</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
          <h2 className="text-lg font-semibold tracking-tight">
            Sign in to access your dashboard
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            ApplyFlow will sync and classify your job application emails.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              onClick={() =>
                signIn("google", { callbackUrl: "/dashboard" })
              }
            >
              Sign in with Google
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                signIn("azure-ad", { callbackUrl: "/dashboard" })
              }
            >
              Sign in with Microsoft
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <DashboardBoard />;
}

