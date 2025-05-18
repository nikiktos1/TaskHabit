"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DaySchedule } from "@/components/day-schedule"

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Календарь</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Выберите дату</CardTitle>
              <CardDescription>Просмотр задач и привычек на выбранный день</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedDate ? (
                  format(selectedDate, "d MMMM yyyy", { locale: ru })
                ) : (
                  "Выберите дату"
                )}
              </CardTitle>
              <CardDescription>Задачи и привычки на выбранный день</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <DaySchedule date={selectedDate} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Выберите дату в календаре для просмотра задач и привычек
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
