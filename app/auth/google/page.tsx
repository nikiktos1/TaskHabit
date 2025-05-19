import { redirect } from "next/navigation";

export default function GoogleAuthPage() {
  // Перенаправляем на наш API Route Handler
  redirect("/api/auth/google");
}
