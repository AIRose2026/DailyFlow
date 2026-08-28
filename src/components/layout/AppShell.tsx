import { BottomNav } from "./BottomNav";

export function AppShell({
  children,
  header,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh pb-28">
      {header}
      <main className="mx-auto max-w-md px-4 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
