"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 2L3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9L12 2zM10 21v-8h4v8H10z" />
      </svg>
    ),
  },
  {
    href: "/log",
    label: "Log",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    href: "/menu",
    label: "Menu",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
      </svg>
    ),
  },
  {
    href: "/progress",
    label: "Progress",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex h-[68px] shrink-0 px-1"
      style={{ backgroundColor: "var(--sf-bg)", borderTop: "1px solid var(--sf-border)" }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-1"
          >
            <div
              className="flex items-center justify-center rounded-2xl transition-all duration-200 ease-out"
              style={
                active
                  ? {
                      backgroundColor: "rgba(0, 210, 255, 0.08)",
                      color: "#00d2ff",
                      paddingLeft: "20px",
                      paddingRight: "20px",
                      paddingTop: "6px",
                      paddingBottom: "6px",
                    }
                  : {
                      color: "var(--sf-text6)",
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      paddingTop: "6px",
                      paddingBottom: "6px",
                    }
              }
            >
              {active ? tab.iconActive : tab.icon}
            </div>
            <span
              className="text-[10px] font-semibold transition-colors duration-200"
              style={{ color: active ? "#00d2ff" : "var(--sf-text6)" }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
