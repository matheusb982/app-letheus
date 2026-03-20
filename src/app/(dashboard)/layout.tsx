export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-sidebar p-4">
        <h2 className="text-lg font-bold mb-4">Letheus</h2>
        <nav className="space-y-2 text-sm text-muted-foreground">
          <p>Sidebar - em construção</p>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
