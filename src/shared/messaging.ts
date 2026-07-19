import type { Highlight, HighlightStyle } from "./types";
import { normalizeUrl } from "./utils";

export type CreateHighlightPayload = Omit<Highlight, "timestamp">;

export interface UpdateHighlightPayload {
  id: string;
  color: string;
  style: HighlightStyle;
}

export interface UpdateNotePayload {
  id: string;
  note: string;
}

export interface DeleteHighlightPayload {
  id: string;
}

export type ExtensionMessage =
  | { type: "ACTION_CLICKED"; payload: CreateHighlightPayload }
  | { type: "UPDATE_HIGHLIGHT"; payload: UpdateHighlightPayload }
  | { type: "UPDATE_NOTE"; payload: UpdateNotePayload }
  | { type: "DELETE_HIGHLIGHT"; payload: DeleteHighlightPayload };

export interface HighlightResult {
  id: string;
  text: string;
  context: string;
}

const getPageTitle = (): string => {
  return document.title;
};

const getPageFavicon = (): string => {
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${location.href}`;
};

export const buildCreatePayload = (
  result: HighlightResult,
  color: string,
  style: HighlightStyle,
  note?: string,
): CreateHighlightPayload => {
  return {
    id: result.id,
    text: result.text,
    url: normalizeUrl(location.href),
    context: result.context,
    color,
    style,
    title: getPageTitle(),
    favicon: getPageFavicon(),
    ...(note !== undefined ? { note } : {}),
  };
};

export const sendCreate = (payload: CreateHighlightPayload) => {
  chrome.runtime.sendMessage({
    type: "ACTION_CLICKED",
    payload,
  });
};

export const sendUpdateHighlight = (payload: UpdateHighlightPayload) => {
  chrome.runtime.sendMessage({ type: "UPDATE_HIGHLIGHT", payload });
};

export const sendUpdateNote = (payload: UpdateNotePayload) => {
  chrome.runtime.sendMessage({ type: "UPDATE_NOTE", payload });
};

export const sendDelete = (id: string) => {
  chrome.runtime.sendMessage({ type: "DELETE_HIGHLIGHT", payload: { id } });
};
