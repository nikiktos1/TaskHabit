"use client";

import { Button } from "./ui/button";
import { signInWithGoogleAction } from "../app/actions";
import { useTransition } from "react";

export function GoogleAuthButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
      disabled={isPending}
      onClick={() => startTransition(() => signInWithGoogleAction())}
    >
      {isPending ? (
        <div className="h-4 w-4 border-t-2 border-b-2 border-current rounded-full animate-spin mr-2"></div>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M12 2c-1.5 2-2 5.5-2 9s.5 7 2 9c1.5-2 2-5.5 2-9s-.5-7-2-9" />
        </svg>
      )}
      {isPending ? "Signing in..." : "Sign in with Google"}
    </Button>
  );
}
