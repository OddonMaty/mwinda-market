"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

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
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isVendor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "mwinda_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load
  useEffect(() => {
    async function initAuth() {
      const supabase = getSupabaseClient();
      const auth = (supabase as any)?.auth;
      if (auth) {
        try {
          const { data } = await auth.getSession();
          if (data?.session?.user) {
            const u = data.session.user;
            setUser({
              id: u.id,
              email: u.email,
              phone: u.phone,
              fullName: u.user_metadata?.full_name || u.email?.split("@")[0] || "Client Mwinda",
              role: u.user_metadata?.role || "customer",
              shopId: u.user_metadata?.shop_id || null,
            });
            setIsLoading(false);
            return;
          }
        } catch {
          // fallback to localStorage if network or session check fails
        }
      }

      // Local storage fallback for seamless PWA / offline / demo experience
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        // ignore
      }

      setIsLoading(false);
    }

    initAuth();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
    const auth = (supabase as any)?.auth;
    if (auth) {
      try {
        const { data, error } = await auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.user_metadata?.full_name || data.user.email?.split("@")[0],
            role: data.user.user_metadata?.role || "customer",
            shopId: data.user.user_metadata?.shop_id || null,
          };
          setUser(profile);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: unknown) {
        console.warn("Supabase auth failed, fallback to local session", err);
      }
    }

    // Fallback demo/mock login if no supabase backend connection
    const profile: UserProfile = {
      id: "usr-" + Math.floor(100000 + Math.random() * 900000),
      email,
      fullName: email.split("@")[0],
      role: "customer",
    };
    setUser(profile);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    setIsLoading(false);
    return { success: true };
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, phone: string) => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
    const auth = (supabase as any)?.auth;
    if (auth) {
      try {
        const { data, error } = await auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone },
          },
        });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email,
            phone,
            fullName,
            role: "customer",
          };
          setUser(profile);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: unknown) {
        console.warn("Supabase signup failed, fallback to local session", err);
      }
    }

    // Fallback demo account
    const profile: UserProfile = {
      id: "usr-" + Math.floor(100000 + Math.random() * 900000),
      email,
      phone,
      fullName,
      role: "customer",
    };
    setUser(profile);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    setIsLoading(false);
    return { success: true };
  };

  const signInWithPhone = async (phone: string, fullName?: string) => {
    setIsLoading(true);
    const profile: UserProfile = {
      id: "usr-ph-" + Math.floor(100000 + Math.random() * 900000),
      phone,
      fullName: fullName || "Client " + phone.slice(-4),
      role: "customer",
    };
    setUser(profile);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    setIsLoading(false);
    return { success: true };
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    const auth = (supabase as any)?.auth;
    if (auth) {
      try {
        await auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      signInWithEmail,
      signUpWithEmail,
      signInWithPhone,
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
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
