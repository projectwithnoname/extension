import {
  ACCESS_TOKEN_EXPIRY_KEY,
  ACCESS_TOKEN_KEY,
  AUTH_STATE_KEY,
  PAIRING_STATE_KEY,
  REFRESH_TOKEN_KEY,
  SIGNED_OUT,
  WEBSITE_ORIGIN,
  stateForUser,
} from "../shared/auth";
import type { AuthPairingMessage, AuthState, AuthUser } from "../shared/auth";

// The only module that touches tokens. Everything else — side panel, content
// script — reads the public mirror at AUTH_STATE_KEY instead.
//
// Nothing is cached in module scope: MV3 tears the worker down after ~30s idle,
// so every entry point re-reads from storage.

/** Refresh this far before actual expiry so an in-flight request can't age out mid-call. */
const REFRESH_LEEWAY_MS = 60 * 1000;

const apiUrl = (path: string): string => `${WEBSITE_ORIGIN}/api/extension/${path}`;

interface TokenResponse {
  accessToken: string;
  expiresAt: number;
  refreshToken: string;
  user: AuthUser;
}

const isTokenResponse = (value: unknown): value is TokenResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<TokenResponse>;

  return (
    typeof candidate.accessToken === "string" &&
    typeof candidate.expiresAt === "number" &&
    typeof candidate.refreshToken === "string" &&
    typeof candidate.user === "object" &&
    candidate.user !== null &&
    typeof candidate.user.sub === "string"
  );
};

export const readAuthState = async (): Promise<AuthState> => {
  const stored = await chrome.storage.local.get(AUTH_STATE_KEY);
  const state = stored[AUTH_STATE_KEY] as AuthState | undefined;

  return state ?? SIGNED_OUT;
};

const writeAuthState = (state: AuthState): Promise<void> => chrome.storage.local.set({ [AUTH_STATE_KEY]: state });

const persistTokens = async (tokens: TokenResponse): Promise<void> => {
  await Promise.all([
    chrome.storage.session.set({
      [ACCESS_TOKEN_KEY]: tokens.accessToken,
      [ACCESS_TOKEN_EXPIRY_KEY]: tokens.expiresAt,
    }),
    chrome.storage.local.set({ [REFRESH_TOKEN_KEY]: tokens.refreshToken }),
  ]);

  await writeAuthState(stateForUser(tokens.user));
};

const clearTokens = async (): Promise<void> => {
  await Promise.all([
    chrome.storage.session.remove([ACCESS_TOKEN_KEY, ACCESS_TOKEN_EXPIRY_KEY]),
    chrome.storage.local.remove(REFRESH_TOKEN_KEY),
  ]);
};

/** Drops every credential and marks the panel signed out. Safe to call from any failure path. */
const resetToSignedOut = async (): Promise<void> => {
  await clearTokens();
  await writeAuthState(SIGNED_OUT);
};

export const startSignIn = async (): Promise<void> => {
  const state = crypto.randomUUID();

  await chrome.storage.session.set({ [PAIRING_STATE_KEY]: state });
  await chrome.tabs.create({
    url: `${WEBSITE_ORIGIN}/extension/connect?state=${encodeURIComponent(state)}&fresh=1`,
    active: true,
  });
};

/**
 * Receives the pairing code from the website and exchanges it for real tokens.
 * Returns whether the pairing was accepted, which the connect page renders.
 */
export const handlePairingCode = async (
  message: AuthPairingMessage,
  sender: chrome.runtime.MessageSender,
): Promise<boolean> => {
  if (sender.origin !== WEBSITE_ORIGIN) {
    return false;
  }

  const stored = await chrome.storage.session.get(PAIRING_STATE_KEY);
  const expectedState = stored[PAIRING_STATE_KEY] as string | undefined;

  if (!expectedState || expectedState !== message.state) {
    return false;
  }

  try {
    const response = await fetch(apiUrl("token"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: message.code }),
    });

    if (!response.ok) {
      return false;
    }

    const payload: unknown = await response.json();

    if (!isTokenResponse(payload)) {
      return false;
    }

    await persistTokens(payload);
    return true;
  } catch (error) {
    console.warn("Pairing exchange failed", error);
    return false;
  } finally {
    await chrome.storage.session.remove(PAIRING_STATE_KEY);
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  const stored = await chrome.storage.local.get(REFRESH_TOKEN_KEY);
  const refreshToken = stored[REFRESH_TOKEN_KEY] as string | undefined;

  if (!refreshToken) {
    await resetToSignedOut();
    return null;
  }

  try {
    const response = await fetch(apiUrl("refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await resetToSignedOut();
      return null;
    }

    const payload: unknown = await response.json();

    if (!isTokenResponse(payload)) {
      await resetToSignedOut();
      return null;
    }

    await persistTokens(payload);
    return payload.accessToken;
  } catch (error) {
    console.warn("Token refresh failed", error);
    return null;
  }
};

/** Returns a usable access token, refreshing first if it is missing or about to expire. */
export const getValidAccessToken = async (): Promise<string | null> => {
  const stored = await chrome.storage.session.get([ACCESS_TOKEN_KEY, ACCESS_TOKEN_EXPIRY_KEY]);
  const token = stored[ACCESS_TOKEN_KEY] as string | undefined;
  const expiresAt = stored[ACCESS_TOKEN_EXPIRY_KEY] as number | undefined;

  if (token && expiresAt && expiresAt - REFRESH_LEEWAY_MS > Date.now()) {
    return token;
  }

  return refreshAccessToken();
};

/**
 * Confirms the session is still good against the website. This is how a sign-out
 * performed on the website eventually reaches the extension — there is no push
 * channel, so it lands on the next alarm or browser start.
 */
export const revalidate = async (): Promise<void> => {
  const token = await getValidAccessToken();

  if (!token) {
    return;
  }

  try {
    const response = await fetch(apiUrl("me"), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      await resetToSignedOut();
      return;
    }

    if (!response.ok) {
      return;
    }

    const payload: unknown = await response.json();
    const user = (payload as { user?: AuthUser }).user;

    if (user?.sub) {
      await writeAuthState(stateForUser(user));
    }
  } catch (error) {
    console.warn("Revalidation failed", error);
  }
};

export const signOut = async (): Promise<void> => {
  const stored = await chrome.storage.session.get(ACCESS_TOKEN_KEY);
  const token = stored[ACCESS_TOKEN_KEY] as string | undefined;

  await resetToSignedOut();

  if (!token) {
    return;
  }

  try {
    await fetch(apiUrl("revoke"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.warn("Revoke request failed", error);
  }
};
