"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { HabitCard } from "@/components/habits/habit-card";
import { CreateHabitForm } from "@/components/habits/create-habit-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Habit, HabitFrequency, HabitStatus } from "@/types/habit";
import { getUserHabits } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useSync } from "@/contexts/sync-context";

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [filteredHabits, setFilteredHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { lastUpdated } = useSync();

  // Загрузка привычек
  const loadHabits = async () => {
    try {
      setLoading(true);
      const data = await getUserHabits();
      setHabits(data);
    } catch (error) {
      console.error("Ошибка при загрузке привычек:", error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка привычек при монтировании компонента или при обновлении lastUpdated
  useEffect(() => {
    loadHabits();
  }, [lastUpdated]);

  // Фильтрация привычек при изменении фильтров
  useEffect(() => {
    let filtered = [...habits];

    // Фильтр по статусу
    if (statusFilter !== "all") {
      filtered = filtered.filter(habit => habit.status === statusFilter);
    }

    // Фильтр по частоте
    if (frequencyFilter !== "all") {
      filtered = filtered.filter(habit => habit.frequency === frequencyFilter);
    }

    // Фильтр по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        habit =>
          habit.title.toLowerCase().includes(query) ||
          (habit.description && habit.description.toLowerCase().includes(query))
      );
    }

    setFilteredHabits(filtered);
  }, [habits, statusFilter, frequencyFilter, searchQuery]);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Мои привычки</h1>
            <p className="text-muted-foreground mt-1">
              Управляйте своими привычками и отслеживайте прогресс
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Новая привычка
          </Button>

          {showCreateDialog && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Создать новую привычку</DialogTitle>
                  <DialogDescription>
                    Заполните форму, чтобы создать новую привычку для отслеживания
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <CreateHabitForm onSuccess={() => {
                    setShowCreateDialog(false);
                    loadHabits();
                  }} />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Фильтры */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Input
              placeholder="Поиск привычек..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Фильтр по статусу" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value={HabitStatus.ACTIVE}>Активные</SelectItem>
              <SelectItem value={HabitStatus.PAUSED}>Приостановленные</SelectItem>
              <SelectItem value={HabitStatus.COMPLETED}>Завершенные</SelectItem>
              <SelectItem value={HabitStatus.FAILED}>Не выполненные</SelectItem>
            </SelectContent>
          </Select>
          <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Фильтр по частоте" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value={HabitFrequency.DAILY}>Ежедневные</SelectItem>
              <SelectItem value={HabitFrequency.WEEKLY}>Еженедельные</SelectItem>
              <SelectItem value={HabitFrequency.MONTHLY}>Ежемесячные</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : filteredHabits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} onUpdate={loadHabits} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">Нет привычек</h3>
            <p className="text-muted-foreground mb-6">
              {habits.length > 0
                ? "Нет привычек, соответствующих выбранным фильтрам"
                : "Создайте свою первую привычку, чтобы начать отслеживание"}
            </p>
            {habits.length === 0 && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Создать привычку
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
