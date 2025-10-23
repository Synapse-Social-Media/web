export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth pages don't need the AppShell (sidebar, topbar, etc.)
  return <div className="min-h-screen">{children}</div>
}
