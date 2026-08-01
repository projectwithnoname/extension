import { isAuthPairingMessage } from "../shared/auth";
import type { AuthRequest } from "../shared/auth";
import type { Highlight } from "../shared/types";
import { handlePairingCode, readAuthState, revalidate, signOut, startSignIn } from "./auth";

const REVALIDATE_ALARM = "auth-revalidate";
const REVALIDATE_PERIOD_MINUTES = 45;

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  chrome.alarms.create(REVALIDATE_ALARM, { periodInMinutes: REVALIDATE_PERIOD_MINUTES });
});

chrome.runtime.onStartup.addListener(() => {
  revalidate();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === REVALIDATE_ALARM) {
    revalidate();
  }
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (!isAuthPairingMessage(message)) {
    return false;
  }

  handlePairingCode(message, sender).then((ok) => {
    sendResponse({ ok });

    // The extension opened this tab, so it closes it once pairing succeeds.
    if (ok && sender.tab?.id !== undefined) {
      chrome.tabs.remove(sender.tab.id).catch(() => {
        // The user may have closed it already; nothing to do.
      });
    }
  });

  return true;
});

chrome.runtime.onMessage.addListener((message: AuthRequest, _sender, sendResponse) => {
  if (message.type === "AUTH_SIGN_IN") {
    startSignIn().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "AUTH_SIGN_OUT") {
    signOut().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "AUTH_REVALIDATE") {
    revalidate().then(async () => sendResponse({ state: await readAuthState() }));
    return true;
  }

  return false;
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

const sendScrollMessage = (tabId: number, highlightId: string, attempt = 0) => {
  chrome.tabs
    .sendMessage(tabId, {
      type: "SCROLL_TO_HIGHLIGHT",
      payload: { id: highlightId },
    })
    .catch((error: Error) => {
      if (attempt < 3 && error.message?.includes("Could not establish connection")) {
        window.setTimeout(() => {
          sendScrollMessage(tabId, highlightId, attempt + 1);
        }, 250);
        return;
      }

      console.warn("Could not reach content script", error);
    });
};

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "ACTION_CLICKED") {
    const { id, text, url, context, color, style, note, title, favicon } = message.payload;

    const newHighlight: Highlight = {
      id,
      text,
      timestamp: Date.now(),
      url,
      context,
      color,
      style,
      note,
      title,
      favicon,
    };

    chrome.storage.local.get("highlights", (result) => {
      const current = (result.highlights as Highlight[]) ?? [];
      chrome.storage.local.set({ highlights: [...current, newHighlight] });
    });
  }

  if (message.type === "UPDATE_HIGHLIGHT") {
    const { id, color, style } = message.payload;

    chrome.storage.local.get("highlights", (result) => {
      const current = (result.highlights as Highlight[]) ?? [];
      chrome.storage.local.set({
        highlights: current.map((highlight) => (highlight.id === id ? { ...highlight, color, style } : highlight)),
      });
    });
  }

  if (message.type === "UPDATE_NOTE") {
    const { id, note } = message.payload;

    chrome.storage.local.get("highlights", (result) => {
      const current = (result.highlights as Highlight[]) ?? [];
      chrome.storage.local.set({
        highlights: current.map((highlight) => (highlight.id === id ? { ...highlight, note } : highlight)),
      });
    });
  }

  if (message.type === "DELETE_HIGHLIGHT") {
    const { id } = message.payload;

    chrome.storage.local.get("highlights", (result) => {
      const current = (result.highlights as Highlight[]) ?? [];
      chrome.storage.local.set({
        highlights: current.filter((highlight) => highlight.id !== id),
      });
    });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "NAVIGATE_TO_HIGHLIGHT") {
    const { url, id } = message.payload;

    chrome.tabs.query({}, (tabs) => {
      const existingTab = tabs.find((tab) => tab.url && tab.url.includes(url));

      if (existingTab?.id !== undefined) {
        chrome.tabs.update(existingTab.id, { active: true });
        chrome.windows.update(existingTab.windowId, { focused: true });
        sendScrollMessage(existingTab.id, id);
        return;
      }

      chrome.tabs.create({ url, active: true }, (newTab) => {
        if (!newTab?.id) {
          return;
        }

        const listener = (tabId: number, changeInfo: { status?: string }) => {
          if (tabId === newTab.id && changeInfo.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);
            sendScrollMessage(tabId, id);
          }
        };

        chrome.tabs.onUpdated.addListener(listener);
      });
    });
  }
});
