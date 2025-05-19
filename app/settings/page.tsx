import { DashboardLayout } from "@/components/dashboard-layout";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Настройки</h1>
        <div className="max-w-md mx-auto">
          <p className="text-center text-muted-foreground">
            Страница настроек находится в разработке.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
