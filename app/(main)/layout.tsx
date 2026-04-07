import { MainNav } from "@/components/layout/main-nav"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container py-6">{children}</main>
    </div>
  )
}
