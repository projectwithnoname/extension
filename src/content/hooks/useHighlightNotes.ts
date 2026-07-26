import { useCallback, useEffect, useState } from "react";
import { loadPageHighlights, setupStorageSync } from "../inject";
import type { Highlight } from "../../shared/types";
import useLatestRef from "./useLatestRef";

/**
 *
 * Owns the per-page notes map (keyed by highlight id): its state, a latest-ref
 * for the hover listener, the initial population from storage, and the single
 * immutable write path. Also subscribes to storage changes so panel-side edits
 * reconcile the page DOM and refresh the notes map in realtime.
 */
export default function useHighlightNotes() {
  const [notes, setNotes] = useState<Map<string, string>>(new Map());

  const notesRef = useLatestRef(notes);

  const rebuildFromHighlights = useCallback((highlights: Pick<Highlight, "id" | "note">[]) => {
    const map = new Map<string, string>();
    highlights.forEach((highlight) => {
      if (highlight.note) {
        map.set(highlight.id, highlight.note);
      }
    });
    setNotes(map);
  }, []);

  useEffect(() => {
    loadPageHighlights().then(rebuildFromHighlights);

    const teardown = setupStorageSync(rebuildFromHighlights);
    return teardown;
  }, [rebuildFromHighlights]);

  const upsertNote = useCallback((id: string, note: string) => {
    setNotes((current) => {
      const next = new Map(current);
      next.set(id, note);
      return next;
    });
  }, []);

  return { notes, notesRef, upsertNote };
}
