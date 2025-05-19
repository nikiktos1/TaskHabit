"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getMonthlyComparisonData } from "@/app/analytics/actions"
import { Skeleton } from "@/components/ui/skeleton"

export function MonthlyComparisonChart() {
  const [period, setPeriod] = useState<"6months" | "year">("6months")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const monthlyData = await getMonthlyComparisonData()
        setData(monthlyData)
      } catch (err: any) {
        console.error("Ошибка при получении данных для графика:", err)
        setError(err.message || "Не удалось загрузить данные")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period]) // Перезагружаем данные при изменении периода

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Сравнение выполненных задач</CardTitle>
          <CardDescription>Количество выполненных задач за последние 6 месяцев</CardDescription>
        </div>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as "6months" | "year")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Выберите период" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6months">Последние 6 месяцев</SelectItem>
            <SelectItem value="year">За год</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="w-full h-[400px] flex items-center justify-center">
            <Skeleton className="w-full h-[400px]" />
          </div>
        ) : error ? (
          <div className="w-full h-[400px] flex items-center justify-center text-destructive">
            {error}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => {
                  return [value, name === "current" ? "Текущий период" : "Предыдущий период"]
                }}
              />
              <Legend
                formatter={(value) => {
                  return value === "current" ? "Текущий период" : "Предыдущий период"
                }}
              />
              <Bar dataKey="current" name="current" fill="#2563eb" />
              <Bar dataKey="previous" name="previous" fill="#94a3b8" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
