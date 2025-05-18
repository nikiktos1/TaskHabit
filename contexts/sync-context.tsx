"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { usePathname } from "next/navigation"

// Интерфейс контекста синхронизации
interface SyncContextType {
  refreshHabitsPage: () => void
  refreshDashboardPage: () => void
  lastUpdated: Date | null
}

// Создаем контекст с начальным значением
const SyncContext = createContext<SyncContextType>({
  refreshHabitsPage: () => {},
  refreshDashboardPage: () => {},
  lastUpdated: null
})

// Хук для использования контекста синхронизации
export function useSync() {
  return useContext(SyncContext)
}

// Провайдер контекста синхронизации
export function SyncProvider({ children }: { children: ReactNode }) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [shouldRefreshHabits, setShouldRefreshHabits] = useState(false)
  const [shouldRefreshDashboard, setShouldRefreshDashboard] = useState(false)
  const pathname = usePathname()

  // Функция для обновления страницы привычек
  const refreshHabitsPage = () => {
    setShouldRefreshHabits(true)
    setLastUpdated(new Date())
  }

  // Функция для обновления страницы Dashboard
  const refreshDashboardPage = () => {
    setShouldRefreshDashboard(true)
    setLastUpdated(new Date())
  }

  // Эффект для автоматического обновления текущей страницы
  useEffect(() => {
    // Если мы на странице привычек и нужно обновить Dashboard
    if (pathname === "/" && shouldRefreshDashboard) {
      // Здесь можно добавить логику для обновления Dashboard
      console.log("Обновление Dashboard...")
      setShouldRefreshDashboard(false)
    }

    // Если мы на странице Dashboard и нужно обновить страницу привычек
    if (pathname === "/habits" && shouldRefreshHabits) {
      // Здесь можно добавить логику для обновления страницы привычек
      console.log("Обновление страницы привычек...")
      setShouldRefreshHabits(false)
      
      // Перезагружаем страницу привычек
      window.location.reload()
    }
  }, [pathname, shouldRefreshHabits, shouldRefreshDashboard])

  return (
    <SyncContext.Provider
      value={{
        refreshHabitsPage,
        refreshDashboardPage,
        lastUpdated
      }}
    >
      {children}
    </SyncContext.Provider>
  )
}
