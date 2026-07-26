import { useEffect, useState } from "react";
import { normalizeUrl } from "../../shared/utils";

const readActiveUrl = async (): Promise<string> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url) {
    try {
      return normalizeUrl(tab.url);
    } catch {
      return tab.url;
    }
  }
  return "";
};

/**
 * @description Tracks the URL of the active tab and keeps it current while the panel is open. Listens directly to chrome.tabs events
 */
export const useActivePage = (): string => {
  const [activePage, setActivePage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      readActiveUrl().then((url) => {
        if (!cancelled) {
          setActivePage(url);
        }
      });
    };

    refresh();

    const handleActivated = () => refresh();

    const handleUpdated = (_tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo, tab: chrome.tabs.Tab) => {
      if (changeInfo.url && tab.active) {
        refresh();
      }
    };

    const handleFocusChanged = () => refresh();

    chrome.tabs.onActivated.addListener(handleActivated);
    chrome.tabs.onUpdated.addListener(handleUpdated);
    chrome.windows.onFocusChanged.addListener(handleFocusChanged);

    return () => {
      cancelled = true;
      chrome.tabs.onActivated.removeListener(handleActivated);
      chrome.tabs.onUpdated.removeListener(handleUpdated);
      chrome.windows.onFocusChanged.removeListener(handleFocusChanged);
    };
  }, []);

  return activePage;
};
