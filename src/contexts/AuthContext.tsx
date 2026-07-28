"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import { signInWithGoogle as authSignIn, signOut as authSignOut } from "@/services/authService";
import { fetchProfile, upsertProfileFromAuth } from "@/services/profileService";
import { fetchUserCompany } from "@/services/companyService";
import type { AuthContextValue, CompanyMember, Profile } from "@/types/auth";
import type { Company } from "@/types/company";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [membership, setMembership] = useState<CompanyMember | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const data = await fetchProfile(user.id);
    setProfile(data);
  }, [user]);

  const refreshCompany = useCallback(async () => {
    if (!user) {
      setCompany(null);
      setMembership(null);
      return;
    }
    const data = await fetchUserCompany(user.id);
    setCompany(data.company);
    setMembership(data.membership);
  }, [user]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let mounted = true;

    const loadUserData = async (currentUser: User) => {
      try {
        let profileData = await fetchProfile(currentUser.id);
        if (!profileData) {
          profileData = await upsertProfileFromAuth(currentUser);
        }
        if (!mounted) return;
        setProfile(profileData);

        if (profileData?.onboarding_completed) {
          const companyData = await fetchUserCompany(currentUser.id);
          if (!mounted) return;
          setCompany(companyData.company);
          setMembership(companyData.membership);
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("[AuthProvider]", err);
      }
    };

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        loadUserData(initialSession.user).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await loadUserData(newSession.user);
      } else {
        setProfile(null);
        setCompany(null);
        setMembership(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    await authSignIn(redirectTo);
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setCompany(null);
    setMembership(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      company,
      membership,
      loading,
      signInWithGoogle,
      signOut,
      refreshProfile,
      refreshCompany,
    }),
    [user, session, profile, company, membership, loading, signInWithGoogle, signOut, refreshProfile, refreshCompany]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
