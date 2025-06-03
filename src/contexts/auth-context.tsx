"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react"
import { setCookie } from "cookies-next";
import { deleteCookie } from "cookies-next";

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

  

const login = (u: User) => {
  setIsLoggingIn(true); // ✅ show loader
  sessionStorage.setItem("user", JSON.stringify(u));
  setCookie("auth", "true", {
  path: "/",
  maxAge: 60 * 60 * 24, // 1 day
  sameSite: "lax",
}); // 1 day
  
  setUser(u);
  router.push("/dashboard");
};




  const logout = () => {
  setIsLoggingOut(true);
  sessionStorage.removeItem("user");
  deleteCookie("auth", { path: "/" });
  setUser(null);
  router.replace("/auth/sign-in");
};


   useEffect(() => {
  if (pathname === "/dashboard") {
    setIsLoggingIn(false);
  }

  if (pathname === "/auth/sign-in") {
    setIsLoggingOut(false);
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
