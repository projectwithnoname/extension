// Auth state shared between the service worker and the side panel.

/** Where the website lives. Must stay in sync with `externally_connectable` in manifest.json. */
export const WEBSITE_ORIGIN = "http://localhost:3000";

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

export type AuthState =
  | { status: "unknown" }
  | { status: "signed-out" }
  | { status: "pending-verification"; user: AuthUser }
  | { status: "signed-in"; user: AuthUser };

export const SIGNED_OUT: AuthState = { status: "signed-out" };
export const AUTH_STATE_KEY = "authState";
export const REFRESH_TOKEN_KEY = "authRefreshToken";
export const ACCESS_TOKEN_KEY = "authAccessToken";
export const ACCESS_TOKEN_EXPIRY_KEY = "authAccessTokenExpiresAt";
export const PAIRING_STATE_KEY = "authPairingState";
export type AuthRequest = { type: "AUTH_SIGN_IN" } | { type: "AUTH_SIGN_OUT" } | { type: "AUTH_REVALIDATE" };

export interface AuthPairingMessage {
  type: "AUTH_PAIRING_CODE";
  code: string;
  state: string;
}

export const isAuthPairingMessage = (message: unknown): message is AuthPairingMessage => {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  const candidate = message as Partial<AuthPairingMessage>;

  return (
    candidate.type === "AUTH_PAIRING_CODE" && typeof candidate.code === "string" && typeof candidate.state === "string"
  );
};

export const stateForUser = (user: AuthUser): AuthState =>
  user.emailVerified ? { status: "signed-in", user } : { status: "pending-verification", user };
