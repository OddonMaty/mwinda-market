"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  fullName?: string;
  role?: "customer" | "vendor" | "admin";
  shopId?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  signInWithPhone: (phone: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isVendor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setUser(data.user || null);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || "Connexion impossible." };
      }
      setUser(data.user);
      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: "Erreur réseau." };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, phone: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || "Inscription impossible." };
      }
      setUser(data.user);
      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: "Erreur réseau." };
    }
  };

  const signInWithPhone = async () => {
    return {
      success: false,
      error: "La connexion par téléphone n'est pas disponible. Utilisez votre email.",
    };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    // À brancher plus tard sur une route /api/auth/profile
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      signInWithEmail,
      signUpWithEmail,
      signInWithPhone,
      updateProfile,
      signOut,
      isAuthenticated: Boolean(user),
      isVendor: user?.role === "vendor" || Boolean(user?.shopId),
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
