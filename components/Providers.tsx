"use client";

import { AppProvider } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>{children}</AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
