"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { signOutAction } from "@/app/actions";
import { useRouter } from "next/navigation";

export function UserInfo() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignOut = async () => {
    try {
      await signOutAction();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
      <Avatar className="h-16 w-16">
        <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name || "User"} />
        <AvatarFallback>{(user.user_metadata.full_name || user.email || "User").substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="text-center">
        <h3 className="font-medium">{user.user_metadata.full_name || "Пользователь"}</h3>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <Button variant="outline" onClick={handleSignOut}>
        Выйти
      </Button>
    </div>
  );
}
