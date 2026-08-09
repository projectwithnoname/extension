export const TOOLBAR_ENABLED_KEY = "toolbarEnabled";

export const DEFAULT_TOOLBAR_ENABLED = true;

const toToolbarEnabled = (value: unknown): boolean => {
  return typeof value === "boolean" ? value : DEFAULT_TOOLBAR_ENABLED;
};

export const readToolbarEnabled = async (): Promise<boolean> => {
  const stored = await chrome.storage.local.get(TOOLBAR_ENABLED_KEY);
  return toToolbarEnabled(stored[TOOLBAR_ENABLED_KEY]);
};

export const writeToolbarEnabled = (enabled: boolean): Promise<void> => {
  return chrome.storage.local.set({ [TOOLBAR_ENABLED_KEY]: enabled });
};

/**
 * @description Subscribes to toolbar-preference changes made in any context.
 *
 * @param onChange - Called with the new preference whenever it is written.
 *
 * @returns A teardown that removes the listener.
 */
export const subscribeToolbarEnabled = (onChange: (enabled: boolean) => void): (() => void) => {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName !== "local") {
      return;
    }

    const change = changes[TOOLBAR_ENABLED_KEY];
    if (!change) {
      return;
    }

    onChange(toToolbarEnabled(change.newValue));
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
};
