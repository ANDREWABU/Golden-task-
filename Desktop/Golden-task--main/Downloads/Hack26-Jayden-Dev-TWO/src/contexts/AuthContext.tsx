import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const DEMO_USER_KEY = "gt_demo_mode";

const DEMO_USER = {
  id: "demo-user-00000000-0000-0000-0000-000000000001",
  email: "demo@studenttalks.com",
  app_metadata: {},
  user_metadata: { full_name: "Demo User" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  loginAsDemo: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(() => localStorage.getItem(DEMO_USER_KEY) === "true");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginAsDemo = () => {
    localStorage.setItem(DEMO_USER_KEY, "true");
    setIsDemoMode(true);
  };

  const signOut = async () => {
    if (isDemoMode) {
      localStorage.removeItem(DEMO_USER_KEY);
      setIsDemoMode(false);
      return;
    }
    await supabase.auth.signOut();
  };

  const user = isDemoMode ? DEMO_USER : (session?.user ?? null);

  return (
    <AuthContext.Provider value={{ session, user, loading: isDemoMode ? false : loading, signOut, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
};
