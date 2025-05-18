"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { UserInfo } from "@/components/user-info";
import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, [supabase.auth]);

  // Если пользователь не авторизован, перенаправляем на страницу входа
  useEffect(() => {
    if (!loading && !user) {
      redirect("/sign-in");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Профиль пользователя</h1>
        <div className="max-w-md mx-auto">
          <UserInfo />
        </div>
      </div>
    </DashboardLayout>
  );
}
