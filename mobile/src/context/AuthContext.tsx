import { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import {
  signIn as cognitoSignIn,
  signUp as cognitoSignUp,
  decodeIdToken,
  type Role,
  type AuthTokens,
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

// Stored under separate keys, not one combined JSON blob — SecureStore has a
// small per-item size limit (~2KB on iOS Keychain) that three JWTs together
// could approach.
const KEYS = {
  idToken: "ajiraswipe_id_token",
  accessToken: "ajiraswipe_access_token",
  refreshToken: "ajiraswipe_refresh_token",
};

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

async function storeTokens(tokens: AuthTokens) {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.idToken, tokens.idToken),
    SecureStore.setItemAsync(KEYS.accessToken, tokens.accessToken),
    SecureStore.setItemAsync(KEYS.refreshToken, tokens.refreshToken),
  ]);
}

async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.idToken),
    SecureStore.deleteItemAsync(KEYS.accessToken),
    SecureStore.deleteItemAsync(KEYS.refreshToken),
  ]);
}

async function restoreFromStorage(): Promise<AuthState> {
  const idToken = await SecureStore.getItemAsync(KEYS.idToken);
  if (!idToken) return { idToken: null, user: null, loading: false };
  try {
    const claims = decodeIdToken(idToken);
    if (claims.exp * 1000 > Date.now()) {
      return stateFromToken(idToken);
    }
    await clearTokens();
  } catch {
    await clearTokens();
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
    restoreFromStorage().then(setState);
  }, []);

  const signIn = async (email: string, password: string) => {
    const tokens = await cognitoSignIn(email, password);
    await storeTokens(tokens);
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
    clearTokens();
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
