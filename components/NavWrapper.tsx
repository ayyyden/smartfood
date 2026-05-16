"use client";

import { usePathname } from "next/navigation";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import type { ReactNode } from "react";

const NO_NAV = new Set(["/auth", "/onboarding"]);

export default function NavWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showNav = !NO_NAV.has(pathname);

  if (!showNav) {
    return <div className="flex flex-1 min-h-0 flex-col">{children}</div>;
  }

  return (
    <>
      <TopNav />
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      <BottomNav />
    </>
  );
}
