"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  
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
  const login = (u: User) => {
    sessionStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    
    setIsLoggingOut(true);                     
    sessionStorage.removeItem("user");
    setUser(null);
    router.push("/auth/sign-in"); 
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
