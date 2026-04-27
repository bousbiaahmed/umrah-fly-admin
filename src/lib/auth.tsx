import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { clearToken, getToken, setToken } from "./api";

type AuthCtx = {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  ready: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTokenState(getToken());
    setReady(true);
  }, []);

  const value: AuthCtx = {
    token,
    isAuthenticated: !!token,
    ready,
    login: (t) => {
      setToken(t);
      setTokenState(t);
    },
    logout: () => {
      clearToken();
      setTokenState(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
