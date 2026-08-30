// Auth contract shared between the service worker, the side panel and the
// website. The website only ever hands us a token for an account whose email is
// already verified, so "signed in" is the only good state there is.

/** Where the website lives. Must stay in sync with `externally_connectable` in manifest.json. */
export const WEBSITE_ORIGIN = "http://localhost:3000";

export const SIGN_IN_URL = `${WEBSITE_ORIGIN}/sign-in`;

/**
 * Where an uninstall sends the browser. The website owns the session — its own
 * cookie and Auth0's SSO cookie both outlive the extension — so removing us
 * cannot sign anyone out on its own; this route is what does it.
 */
export const LOGOUT_URL = `${WEBSITE_ORIGIN}/auth/logout`;

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export type AuthState = { status: "unknown" } | { status: "signed-out" } | { status: "signed-in"; user: AuthUser };

export const SIGNED_OUT: AuthState = { status: "signed-out" };

export const AUTH_STATE_KEY = "authState";

export const ACCESS_TOKEN_KEY = "authAccessToken";

export type AuthRequest = { type: "AUTH_SIGN_IN" } | { type: "AUTH_SIGN_OUT" };

export interface AuthTokenMessage {
  type: "AUTH_TOKEN";
  token: string;
  user: AuthUser;
}

export const isAuthTokenMessage = (message: unknown): message is AuthTokenMessage => {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  const candidate = message as Partial<AuthTokenMessage>;

  return (
    candidate.type === "AUTH_TOKEN" &&
    typeof candidate.token === "string" &&
    typeof candidate.user === "object" &&
    candidate.user !== null &&
    typeof candidate.user.sub === "string"
  );
};
