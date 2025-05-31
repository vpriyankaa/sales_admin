import "@/css/satoshi.css";
import "@/css/style.css";
import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

import NextTopLoader from "nextjs-toploader";
import { Providers } from "./providers";
import { AuthProvider } from "@/contexts/auth-context";
import AuthGate from "@/components/AuthGate"; // ✅ import the client-only component

export const metadata: Metadata = {
  title: {
    template: "Saamy Agency",
    default: "Saamy Agency",
  },
  description: "Saamy Agency",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <Providers>
            <NextTopLoader color="#5750F1" showSpinner={false} />
            <AuthGate>{children}</AuthGate>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}

