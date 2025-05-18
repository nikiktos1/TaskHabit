import type React from "react"
import type { Metadata } from "next/types"
import { Poppins, Lato } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { HabitsProvider } from "@/contexts/habits-context"
import { TasksProvider } from "@/contexts/tasks-context"
import { SyncProvider } from "@/contexts/sync-context"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
})

export const metadata: Metadata = {
  title: "TaskHabit - Project Management",
  description:
    "Помочь пользователям совмещать ежедневные задачи и долгосрочные привычки в едином интерфейсе с аналитикой продуктивности",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${lato.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SyncProvider>
            <TasksProvider>
              <HabitsProvider>
                {children}
              </HabitsProvider>
            </TasksProvider>
          </SyncProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
