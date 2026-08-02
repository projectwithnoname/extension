import { ACCESS_TOKEN_KEY, AUTH0_ORIGIN, AUTH_STATE_KEY, LOGOUT_URL, SIGNED_OUT, WEBSITE_ORIGIN } from "../shared/auth";
import type { AuthState, AuthTokenMessage, AuthUser } from "../shared/auth";

export const readAuthState = async (): Promise<AuthState> => {
  const stored = await chrome.storage.local.get(AUTH_STATE_KEY);

  return (stored[AUTH_STATE_KEY] as AuthState | undefined) ?? SIGNED_OUT;
};

export const getAccessToken = async (): Promise<string | null> => {
  const stored = await chrome.storage.local.get(ACCESS_TOKEN_KEY);

  return (stored[ACCESS_TOKEN_KEY] as string | undefined) ?? null;
};

export const startSignIn = (): Promise<chrome.tabs.Tab> =>
  chrome.tabs.create({ url: `${WEBSITE_ORIGIN}/sign-in`, active: true });

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

/** Give up on the logout round-trip rather than leaving a tab open forever. */
const LOGOUT_TIMEOUT_MS = 10_000;

/**
 * Drives the website's /auth/logout in a background tab and closes it once the
 * redirect chain lands back on us. Clearing storage alone is not a sign-out:
 * the website's session cookie and Auth0's SSO cookie each log the user
 * straight back in with no prompt, so the round-trip is what actually ends the
 * session on both.
 */
const endWebsiteSession = async (): Promise<void> => {
  const tab = await chrome.tabs.create({ url: LOGOUT_URL, active: false });

  if (tab.id === undefined) {
    return;
  }

  const tabId = tab.id;

  await new Promise<void>((resolve) => {
    const finish = () => {
      chrome.tabs.onUpdated.removeListener(handleUpdate);
      clearTimeout(timer);
      resolve();
    };

    const handleUpdate = (updatedId: number, change: chrome.tabs.OnUpdatedInfo, updated: chrome.tabs.Tab) => {
      // The chain is /auth/logout → {tenant}.auth0.com → back here, so only a
      // completed load on our origin that is no longer the logout route is done.
      if (
        updatedId === tabId &&
        change.status === "complete" &&
        updated.url?.startsWith(WEBSITE_ORIGIN) &&
        !updated.url.includes("/auth/logout")
      ) {
        finish();
      }
    };

    const timer = setTimeout(finish, LOGOUT_TIMEOUT_MS);

    chrome.tabs.onUpdated.addListener(handleUpdate);
  });

  await chrome.tabs.remove(tabId).catch(() => undefined);
};

/**
 * Belt and braces after the logout round-trip: if the website was unreachable
 * (dev server down, offline) its cookie would survive and silently sign the
 * user back in. Removing them by hand guarantees the browser has forgotten the
 * account either way.
 */
const clearAuthCookies = async (): Promise<void> => {
  const cookies = await Promise.all([WEBSITE_ORIGIN, AUTH0_ORIGIN].map((url) => chrome.cookies.getAll({ url })));

  await Promise.all(
    cookies.flat().map((cookie) => {
      const host = cookie.domain.replace(/^\./, "");
      const url = `${cookie.secure ? "https" : "http"}://${host}${cookie.path}`;

      return chrome.cookies.remove({ url, name: cookie.name, storeId: cookie.storeId }).catch(() => undefined);
    }),
  );
};

export const signOut = async (): Promise<void> => {
  await chrome.storage.local.remove(ACCESS_TOKEN_KEY);
  await chrome.storage.local.set({ [AUTH_STATE_KEY]: SIGNED_OUT });

  await endWebsiteSession();
  await clearAuthCookies();
};
