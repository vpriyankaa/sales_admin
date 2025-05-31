"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter ,usePathname } from "next/navigation";
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


    setUser(null);
    // router.push("/"); 

    // In logout function
    setTimeout(async () => {

      setIsLoggingOut(true);
      sessionStorage.removeItem("user");
      const pushResult = await router.push("/auth/sign-in");
      // console.log("usePathname:", pathname); 
      
      if (pathname !== '/auth/sign-in' && isLoggingOut) {
            console.log("Auth Guard: Redirecting to sign-in page due to unauthenticated user.");
            router.replace('/auth/sign-in'); 
            setIsLoggingOut(false);
      } else{
      setIsLoggingOut(false);
    }


    }, 500);


  };

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

      {isLoggingOut && (

        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>


      )}
      {!isLoggingOut && children}
    </AuthContext.Provider>
  );
}
