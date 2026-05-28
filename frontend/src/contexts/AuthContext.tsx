import { createContext, useState, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { fetchUserProfile } from "../services/api";

interface User {
  id: number;
  email: string;
  role: "student" | "owner" | "admin";
  is_active: boolean;
  is_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  signup: (
    email: string,
    password: string,
    role: string,
    fullName: string,
    additionalData?: any,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token =
        localStorage.getItem("token") || localStorage.getItem("access_token");
      if (token) {
        try {
          const userData = await fetchUserProfile();
          setUser(userData);
        } catch (error) {
          console.error("Failed to load user:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("access_token");
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async () => {
    const userData = await fetchUserProfile();
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    setUser(null);
  };

  const signup = async (
    _email: string,
    _password: string,
    _role: string,
    _fullName: string,
    _additionalData?: any,
  ) => {
    // Signup logic will be handled in the AuthPage
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, login, logout, signup }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
