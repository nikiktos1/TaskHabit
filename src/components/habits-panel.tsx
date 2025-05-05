"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Plus, Trash2 } from "lucide-react"

type Habit = {
  id: string
  title: string
  streak: number
  target: number
}

export function HabitsPanel() {
  const [habits, setHabits] = useState<Habit[]>([
    { id: "1", title: "Daily meditation", streak: 5, target: 7 },
    { id: "2", title: "Read for 30 minutes", streak: 3, target: 7 },
    { id: "3", title: "Exercise", streak: 2, target: 5 },
  ])
  const [newHabitTitle, setNewHabitTitle] = useState("")

  const addHabit = () => {
    if (newHabitTitle.trim()) {
      setHabits([
        ...habits,
        {
          id: Date.now().toString(),
          title: newHabitTitle,
          streak: 0,
          target: 7,
        },
      ])
      setNewHabitTitle("")
    }
  }

  const incrementStreak = (id: string) => {
    setHabits(
      habits.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              streak: Math.min(habit.streak + 1, habit.target),
            }
          : habit,
      ),
    )
  }

  const deleteHabit = (id: string) => {
    setHabits(habits.filter((habit) => habit.id !== id))
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Long-term Habits</CardTitle>
        <CardDescription>Track your habits and build consistency</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Add a new habit..."
            value={newHabitTitle}
            onChange={(e) => setNewHabitTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addHabit()
              }
            }}
          />
          <Button onClick={addHabit}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        <div className="space-y-6">
          {habits.map((habit) => (
            <div key={habit.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">{habit.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    Streak: {habit.streak}/{habit.target} days
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => incrementStreak(habit.id)}>
                    Complete
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteHabit(habit.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <Progress value={(habit.streak / habit.target) * 100} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}