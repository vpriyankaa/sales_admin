"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react"

type User = {
  id: number;
  name: string;
  phone: number | string;
  email: string | null;
  created_at: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (u: User) => void;
  isLoggingOut: boolean;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const router = useRouter();
  const pathname = usePathname();


  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);


  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  /** call this after successful sign‑in */
  // const login = (u: User) => {
  //   sessionStorage.setItem("user", JSON.stringify(u));
  //   setUser(u);
  //   router.push("/dashboard");

  // };


  const login = async (u: User) => {
    setIsLoggingIn(true);
    sessionStorage.setItem("user", JSON.stringify(u));
    setUser(u);

    // Delay just enough for UI to catch up
    await new Promise((r) => setTimeout(r, 50));

    router.push("/dashboard");
  };


  // const logout = () => {
  // setIsLoggingOut(true);
  // sessionStorage.removeItem("user"); // or sessionStorage
  // setUser(null);

  // router.replace("/auth/sign-in");
  // setTimeout(() => {
  //   setIsLoggingOut(false);
  //   window.location.reload(); // Only if really needed
  // }, 100);
  // };

  const logout = async () => {
    setIsLoggingOut(true);
    sessionStorage.removeItem("user");
    setUser(null);

    await new Promise((r) => setTimeout(r, 50));
    window.location.href = "/auth/sign-in"; // full reload
  };





  //   if (loading) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center">
  //       <Loader2 className="h-6 w-6 animate-spin text-primary" />
  //     </div>
  //   );
  // }


useEffect(() => {
  if (pathname === "/dashboard") {
    setIsLoggingIn(false); // Clear loader after redirect
  }
}, [pathname]);


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggingOut,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {/* {children} */}

      {/* {!isLoggingOut && children} */}
      <>
        {children}
        {(isLoggingOut || isLoggingIn) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

      </>
    </AuthContext.Provider>
  );
}
