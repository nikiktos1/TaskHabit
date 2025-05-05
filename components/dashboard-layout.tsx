import type React from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-6">{children}</main>
      <Footer />
    </div>
  )
}
