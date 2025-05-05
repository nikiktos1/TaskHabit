"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { name: "Mon", tasks: 4, habits: 2 },
  { name: "Tue", tasks: 3, habits: 3 },
  { name: "Wed", tasks: 5, habits: 2 },
  { name: "Thu", tasks: 2, habits: 3 },
  { name: "Fri", tasks: 6, habits: 1 },
  { name: "Sat", tasks: 3, habits: 2 },
  { name: "Sun", tasks: 2, habits: 3 },
]

export function AnalyticsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Productivity</CardTitle>
        <CardDescription>Your task and habit completion for the week</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="tasks" name="Tasks Completed" fill="#2563eb" />
            <Bar dataKey="habits" name="Habits Completed" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}