import { AppShell } from "@/components/layout/AppShell";

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell title="Settings">{children}</AppShell>;
}

