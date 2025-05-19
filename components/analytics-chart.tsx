"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { getWeeklyData } from "@/app/analytics/actions"
import { Skeleton } from "@/components/ui/skeleton"

export function AnalyticsChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const weeklyData = await getWeeklyData()
        setData(weeklyData)
      } catch (err: any) {
        console.error("Ошибка при получении данных для графика:", err)
        setError(err.message || "Не удалось загрузить данные")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Недельная продуктивность</CardTitle>
        <CardDescription>Выполненные задачи и привычки за неделю</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="w-full h-[300px] flex items-center justify-center">
            <Skeleton className="w-full h-[300px]" />
          </div>
        ) : error ? (
          <div className="w-full h-[300px] flex items-center justify-center text-destructive">
            {error}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => {
                  return [value, name === "tasks" ? "Задачи" : "Привычки"]
                }}
              />
              <Legend
                formatter={(value) => {
                  return value === "tasks" ? "Выполненные задачи" : "Выполненные привычки"
                }}
              />
              <Bar dataKey="tasks" name="tasks" fill="#2563eb" />
              <Bar dataKey="habits" name="habits" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
