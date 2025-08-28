// src/contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js"; // ← Supabaseの型をimport

type AuthContextType = {
  user: User | null;
  handleProtectedAction: () => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 初期ユーザー取得
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });

    // 認証状態の変更を監視
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleProtectedAction = () => {
    if (!user) {
      alert("You need to log in first.");
      return false;
    }
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, handleProtectedAction }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
