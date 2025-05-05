import Link from "next/link"
import { CheckCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-accent" />
          <span className="text-sm font-bold text-accent">TaskHabit</span>
        </div>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} TaskHabit. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-accent">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-accent">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}
