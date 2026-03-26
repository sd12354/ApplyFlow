import { AppShell } from "@/components/layout/AppShell";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell title="Dashboard" subtitle="Stay on top of your job applications.">
      {children}
    </AppShell>
  );
}

