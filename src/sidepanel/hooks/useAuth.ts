import { createContext, useContext } from "react";
import type { AuthState } from "../../shared/auth";

export interface AuthContextValue {
  state: AuthState;
  signIn: () => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return context;
};
