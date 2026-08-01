import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AUTH_STATE_KEY, SIGNED_OUT } from "../../shared/auth";
import type { AuthRequest, AuthState } from "../../shared/auth";
import { AuthContext, type AuthContextValue } from "../hooks/useAuth";

const send = (message: AuthRequest) => {
  chrome.runtime.sendMessage(message).catch((error) => console.warn("Auth message failed", error));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({ status: "unknown" });

  useEffect(() => {
    chrome.storage.local.get(AUTH_STATE_KEY, (result: { [AUTH_STATE_KEY]?: AuthState }) => {
      setState(result[AUTH_STATE_KEY] ?? SIGNED_OUT);
    });

    const handleChange = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === "local" && changes[AUTH_STATE_KEY]) {
        setState((changes[AUTH_STATE_KEY].newValue as AuthState | undefined) ?? SIGNED_OUT);
      }
    };

    chrome.storage.onChanged.addListener(handleChange);

    send({ type: "AUTH_REVALIDATE" });

    return () => chrome.storage.onChanged.removeListener(handleChange);
  }, []);

  const value: AuthContextValue = {
    state,
    signIn: useCallback(() => send({ type: "AUTH_SIGN_IN" }), []),
    signOut: useCallback(() => send({ type: "AUTH_SIGN_OUT" }), []),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
