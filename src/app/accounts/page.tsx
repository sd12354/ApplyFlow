import Link from "next/link";
import { Button } from "@/components/ui/button";

type AccountsPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Connected Accounts</h2>
        <p className="text-xs text-zinc-500">
          Connect your inbox to sync and classify job application emails.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/api/connect/google?callbackUrl=/accounts">
          <Button variant="outline">Connect Google (Gmail)</Button>
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error === "missing_google_oauth" &&
            "Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in your environment."}
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-white/70 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300">
        After connecting, click <span className="font-medium">Sync emails</span> on the dashboard.
      </div>
    </div>
  );
}

