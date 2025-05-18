import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  try {
    const supabase = await createClient();
    const headersList = headers();
    const origin = headersList.get("origin") || "http://localhost:3000";

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error("Google auth error:", error);
      return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, origin));
    }

    if (!data || !data.url) {
      console.error("No URL returned from OAuth provider");
      return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent("Authentication error: No URL returned")}`, origin));
    }

    return NextResponse.redirect(new URL(data.url));
  } catch (err) {
    console.error("Unexpected error during Google sign-in:", err);
    const origin = headers().get("origin") || "http://localhost:3000";
    return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent("An unexpected error occurred")}`, origin));
  }
}
