"use client";

import { signOutAction } from "../app/actions";
import { Button } from "./ui/button";
import { useTransition } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isPending, startTransition] = useTransition();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">TaskHabit</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center">
            <Button
              variant="ghost"
              disabled={isPending}
              onClick={() => startTransition(() => signOutAction())}
            >
              {isPending ? "Signing out..." : "Sign out"}
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
