import { useCallback, useEffect, useRef, useState } from "react";
import { setupNoteHover } from "../inject";

interface UseNoteViewerArgs {
  notesRef: React.RefObject<Map<string, string>>;
}

/**
 *
 * Owns the hover note popover: its state, the delayed-hide timer, and the
 * setupNoteHover subscription which reads the latest notes via notesRef.
 */
export default function useNoteViewer({ notesRef }: UseNoteViewerArgs) {
  const [viewerState, setViewerState] = useState({
    visible: false,
    x: 0,
    y: 0,
    highlightId: null as string | null,
    note: "",
  });

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current !== null) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    setViewerState((current) => (current.visible ? { ...current, visible: false } : current));
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => {
      hideTimer.current = null;
      hide();
    }, 200);
  }, [clearHideTimer, hide]);

  const hideImmediately = useCallback(() => {
    clearHideTimer();
    hide();
  }, [clearHideTimer, hide]);

  useEffect(() => {
    const showNoteViewer = (x: number, y: number, highlightId: string) => {
      const note = notesRef.current.get(highlightId);
      if (!note) {
        return;
      }

      clearHideTimer();
      setViewerState((current) => {
        // Already showing this highlight's note: keep the popover put. Hover
        // fires per span (a highlight can be many spans), so re-setting here
        // would make the note jump line to line and re-render away any inline
        // edit in progress.
        if (current.visible && current.highlightId === highlightId) {
          return current;
        }
        return { visible: true, x, y, highlightId, note };
      });
    };

    return setupNoteHover(showNoteViewer, scheduleHide);
  }, [notesRef, clearHideTimer, scheduleHide]);

  return { viewerState, clearHideTimer, hide, scheduleHide, hideImmediately };
}
