"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function UrlProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = `${pathname}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;
    window.history.replaceState({}, "", url);
  }, [pathname, searchParams]);

  return <>{children}</>;
}
