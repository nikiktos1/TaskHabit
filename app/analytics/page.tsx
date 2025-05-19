"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AnalyticsChart } from "@/components/analytics-chart"
import { MonthlyComparisonChart } from "@/components/monthly-comparison-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ListChecks, TrendingUp, Award } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { getAnalyticsSummary, getProductiveDaysData, getHabitConsistencyData } from "./actions"

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null)
  const [productiveDays, setProductiveDays] = useState<any[]>([])
  const [habitConsistency, setHabitConsistency] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Загружаем все данные параллельно
        const [summaryData, productiveDaysData, habitConsistencyData] = await Promise.all([
          getAnalyticsSummary(),
          getProductiveDaysData(),
          getHabitConsistencyData()
        ])

        setSummary(summaryData)
        setProductiveDays(productiveDaysData)
        setHabitConsistency(habitConsistencyData)
      } catch (err: any) {
        console.error("Ошибка при получении данных аналитики:", err)
        setError(err.message || "Не удалось загрузить данные аналитики")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Аналитика продуктивности</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Выполненные задачи</CardTitle>
              <ListChecks className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{summary?.tasksCompleted || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.tasksCompletedChange > 0 ? "+" : ""}{summary?.tasksCompletedChange || 0} с прошлой недели
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Серия привычек</CardTitle>
              <CheckCircle className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{summary?.currentHabitStreak || 0} дней</div>
                  <p className="text-xs text-muted-foreground">
                    Максимум: {summary?.longestHabitStreak || 0} дней
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Продуктивность</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{summary?.productivityScore || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.productivityScoreChange > 0 ? "+" : ""}{summary?.productivityScoreChange || 0}% с прошлой недели
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Достижения</CardTitle>
              <Award className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{summary?.achievements || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.newAchievements || 0} новых в этом месяце
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <AnalyticsChart />

        <MonthlyComparisonChart />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Самые продуктивные дни</CardTitle>
              <CardDescription>Дни, когда вы выполняете больше всего задач</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : error ? (
                <div className="text-destructive">{error}</div>
              ) : productiveDays.length === 0 ? (
                <div className="text-muted-foreground">Недостаточно данных</div>
              ) : (
                <div className="space-y-2">
                  {productiveDays.map((day, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{day.day}</span>
                      <span className="font-medium">{day.percentage}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Последовательность привычек</CardTitle>
              <CardDescription>Ваши самые последовательные привычки</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : error ? (
                <div className="text-destructive">{error}</div>
              ) : habitConsistency.length === 0 ? (
                <div className="text-muted-foreground">Недостаточно данных</div>
              ) : (
                <div className="space-y-2">
                  {habitConsistency.map((habit, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{habit.title}</span>
                      <span className="font-medium">{habit.percentage}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
