"use client";

import { ThemeProvider } from "next-themes";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { AuthProvider } from "@/contexts/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"         // ⬅️ Required for Tailwind's `dark:` to work
      defaultTheme="light"      // ⬅️ Optional: can be "system" if you prefer
      enableSystem={true}       // ⬅️ Enables matching OS theme
    >
      <AuthProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
