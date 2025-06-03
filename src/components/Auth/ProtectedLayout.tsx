"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // useEffect(() => {

  //   // console.log("isAuthenticated",isAuthenticated);
  //   // console.log("user",loading);

  //   if (!loading && !isAuthenticated) {
  //     router.replace("/auth/sign-in");
  //   }
  // }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) return null;

  return <>{children}</>;
}
