import { ACCESS_TOKEN_KEY, AUTH_STATE_KEY, LOGOUT_URL, SIGNED_OUT, SIGN_IN_URL, WEBSITE_ORIGIN } from "../shared/auth";
import type { AuthState, AuthTokenMessage, AuthUser } from "../shared/auth";

export const readAuthState = async (): Promise<AuthState> => {
  const stored = await chrome.storage.local.get(AUTH_STATE_KEY);

  return (stored[AUTH_STATE_KEY] as AuthState | undefined) ?? SIGNED_OUT;
};

export const getAccessToken = async (): Promise<string | null> => {
  const stored = await chrome.storage.local.get(ACCESS_TOKEN_KEY);

  return (stored[ACCESS_TOKEN_KEY] as string | undefined) ?? null;
};

export const startSignIn = (): Promise<chrome.tabs.Tab> => chrome.tabs.create({ url: SIGN_IN_URL, active: true });

/**
 * Stores the token the website just handed us. Returns whether it was accepted,
 * which the website renders as "Extension connected".
 */
export const handleToken = async (
  message: AuthTokenMessage,
  sender: chrome.runtime.MessageSender,
): Promise<boolean> => {
  if (sender.origin !== WEBSITE_ORIGIN) {
    return false;
  }

  const user: AuthUser = message.user;

  await chrome.storage.local.set({
    [ACCESS_TOKEN_KEY]: message.token,
    [AUTH_STATE_KEY]: { status: "signed-in", user } satisfies AuthState,
  });

  return true;
};

export const openSignOut = (): Promise<chrome.tabs.Tab> => chrome.tabs.create({ url: SIGN_IN_URL, active: true });

export const clearSession = async (sender: chrome.runtime.MessageSender): Promise<boolean> => {
  if (sender.origin !== WEBSITE_ORIGIN) {
    return false;
  }

  await chrome.storage.local.remove(ACCESS_TOKEN_KEY);
  await chrome.storage.local.set({ [AUTH_STATE_KEY]: SIGNED_OUT });

  return true;
};

/**
 * Uninstalling runs no code of ours, so the one thing Chrome will do on our
 * behalf is open a URL. Point it at the website's logout while someone is
 * signed in, and clear it again when they are not — an uninstall by a
 * signed-out user should open nothing at all.
 */
export const uninstallUrlFor = (state: AuthState): string => (state.status === "signed-in" ? LOGOUT_URL : "");

export const syncUninstallLogout = (state: AuthState): Promise<void> =>
  chrome.runtime.setUninstallURL(uninstallUrlFor(state));
