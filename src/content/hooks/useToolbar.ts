import { useCallback, useEffect, useState } from "react";
import { setupHighlighter } from "../inject";

interface UseToolbarArgs {
  /*
   * Called right before the toolbar is shown for a fresh selection, so the open
   * note viewer can be closed first (the two must not coexist).
   */
  onBeforeShow: () => void;

  /*
   * The user's "toolbar enabled" preference
   */
  enabled: boolean;
}

/*
 * Owns the floating toolbar state and the setupHighlighter subscription that
 * raises/hides it on selection changes.
 */
export default function useToolbar({ onBeforeShow, enabled }: UseToolbarArgs) {
  const [toolbarState, setToolbarState] = useState({
    visible: false,
    x: 0,
    y: 0,
    highlightId: null as string | null,
    canHighlight: true,
  });

  const hide = useCallback(() => {
    setToolbarState((current) => (current.visible ? { ...current, visible: false } : current));
  }, []);

  const [previousEnabled, setPreviousEnabled] = useState(enabled);
  if (previousEnabled !== enabled) {
    setPreviousEnabled(enabled);

    if (!enabled) {
      hide();
    }
  }

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const renderToolbar = (x: number, y: number, highlightId: string | null, canHighlight: boolean) => {
      onBeforeShow();
      setToolbarState({ visible: true, x, y, highlightId, canHighlight });
    };

    return setupHighlighter(renderToolbar, hide);
  }, [onBeforeShow, hide, enabled]);

  return { toolbarState, hide };
}
