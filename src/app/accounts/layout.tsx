import { AppShell } from "@/components/layout/AppShell";

export default function AccountsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell title="Connected Accounts">
      {children}
    </AppShell>
  );
}

