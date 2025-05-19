import { DashboardLayout } from "@/components/dashboard-layout"
import { TasksPanel } from "@/components/tasks-panel"
import { HabitsPanel } from "@/components/habits-panel"

export default function Home() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <TasksPanel />
        <HabitsPanel />
      </div>
    </DashboardLayout>
  )
}
