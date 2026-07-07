"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchKorisnikByUserUuid } from "@/lib/auth/korisnik";
import type { Korisnik } from "@/types/database";
import type { User } from "@supabase/supabase-js";

type AuthContextValue = {
  user: User | null;
  korisnik: Korisnik | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [korisnik, setKorisnik] = useState<Korisnik | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (authUser: User | null) => {
      if (!authUser) {
        setKorisnik(null);
        return;
      }
      const profile = await fetchKorisnikByUserUuid(supabase, authUser.id);
      setKorisnik(profile);
    },
    [supabase],
  );

  const refreshProfile = useCallback(async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    setUser(currentUser);
    await loadProfile(currentUser);
  }, [supabase, loadProfile]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      void loadProfile(currentUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setLoading(false);
      if (!nextUser) {
        setKorisnik(null);
        return;
      }
      setTimeout(() => {
        void loadProfile(nextUser);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const value = useMemo(
    () => ({ user, korisnik, loading, refreshProfile }),
    [user, korisnik, loading, refreshProfile],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth mora biti unutar AuthProvider-a");
  }
  return ctx;
}
