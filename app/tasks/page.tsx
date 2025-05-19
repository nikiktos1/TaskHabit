import { DashboardLayout } from "@/components/dashboard-layout"
import { TasksPage } from "@/components/tasks-page"

export default function TasksRoute() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <TasksPage />
      </div>
    </DashboardLayout>
  )
}
