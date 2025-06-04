'use client';

import { useAuth } from "@/contexts/auth-context";
import { PropsWithChildren } from "react";
import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { useEffect } from "react";
import { useRouter } from "next/navigation";


export default function AuthGate({ children }: PropsWithChildren) {
  const { isAuthenticated, loading } = useAuth();
const auth = useAuth();
  const router = useRouter();

  
  useEffect(() => {
  if (!loading && !isAuthenticated) {
    router.push("/auth/sign-in");
  }
}, [loading, isAuthenticated, router]);
  
  if (loading) return null;

  // If NOT authenticated (no user and no cookie), show only children (e.g., login page) and NO sidebar/header
  if (!isAuthenticated) return <>{children}</>;



  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="w-full bg-gray-100 dark:bg-[#020d1a]">
        <Header />
        <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
