import type { Highlight } from "../shared/types";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

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
