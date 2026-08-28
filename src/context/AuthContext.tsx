"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  signIn as cognitoSignIn,
  signUp as cognitoSignUp,
  decodeIdToken,
  type Role,
} from "@/lib/auth";

type AuthUser = {
  sub: string;
  email: string;
  name: string;
  role: Role;
};

type AuthState = {
  idToken: string | null;
  user: AuthUser | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: Role
  ) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "ajiraswipe_tokens";

function stateFromToken(token: string): AuthState {
  const claims = decodeIdToken(token);
  return {
    idToken: token,
    user: {
      sub: claims.sub,
      email: claims.email,
      name: claims.name,
      role: claims["custom:role"],
    },
    loading: false,
  };
}

function restoreFromStorage(): AuthState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { idToken: null, user: null, loading: false };
  try {
    const stored = JSON.parse(raw) as { idToken: string };
    const claims = decodeIdToken(stored.idToken);
    if (claims.exp * 1000 > Date.now()) {
      return stateFromToken(stored.idToken);
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return { idToken: null, user: null, loading: false };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    idToken: null,
    user: null,
    loading: true,
  });

  useEffect(() => {
    // localStorage doesn't exist during SSR, so this can't run during the
    // initial render without a server/client hydration mismatch — it has to
    // happen post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(restoreFromStorage());
  }, []);

  const signIn = async (email: string, password: string) => {
    const tokens = await cognitoSignIn(email, password);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    setState(stateFromToken(tokens.idToken));
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: Role
  ) => {
    await cognitoSignUp(email, password, name, role);
    await signIn(email, password);
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ idToken: null, user: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
