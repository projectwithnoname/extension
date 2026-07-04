import React from "react";
import ReactDOM from "react-dom/client";
import Toolbar from "./Toolbar";
import NoteViewer from "./note/NoteViewer";
import {
  higlightSelectedText,
  highlightWithNote,
  hasActiveSelection,
  removeHighlight,
  markHighlightHasNote,
  clearSelectionState,
  restyleHighlight,
} from "./inject";
import type { HighlightStyle } from "../shared/types";
import styles from "./styles.scss?inline";
import { buildCreatePayload, sendCreate, sendUpdateHighlight, sendUpdateNote, sendDelete } from "../shared/messaging";
import useHighlightNotes from "./hooks/useHighlightNotes";
import useNoteViewer from "./hooks/useNoteViewer";
import useToolbar from "./hooks/useToolbar";

const host = document.createElement("div");
host.id = "my-extension-root";
host.style.setProperty("all", "initial", "important");
document.body.appendChild(host);

const shadowRoot = host.attachShadow({ mode: "closed" });

const styleEl = document.createElement("style");
styleEl.textContent = styles;
shadowRoot.appendChild(styleEl);

const mountPoint = document.createElement("div");
mountPoint.id = "extension-root";
shadowRoot.appendChild(mountPoint);

const HighlighterRoot = () => {
  const notes = useHighlightNotes();

  /*
   * Order matters: useNoteViewer must be created before useToolbar, because the
   * toolbar closes the viewer (via hideImmediately) whenever a fresh selection
   * raises it. The two popovers must never coexist.
   */
  const viewer = useNoteViewer({ notesRef: notes.notesRef });
  const toolbar = useToolbar({ onBeforeShow: viewer.hideImmediately });

  const onHighlight = (color: string, style: HighlightStyle) => {
    const result = higlightSelectedText(color, style);
    if (!result) {
      return;
    }

    sendCreate(buildCreatePayload(result, color, style));
    toolbar.hide();
  };

  const onRestyle = (color: string, style: HighlightStyle) => {
    const id = toolbar.toolbarState.highlightId;
    if (!id) {
      return;
    }

    restyleHighlight(id, color, style);
    sendUpdateHighlight({ id, color, style });
  };

  const onAddNote = (): boolean => {
    return hasActiveSelection();
  };

  const onSaveNote = (note: string, color: string, style: HighlightStyle) => {
    const existingId = toolbar.toolbarState.highlightId;
    if (existingId) {
      markHighlightHasNote(existingId);
      notes.upsertNote(existingId, note);

      sendUpdateNote({ id: existingId, note });

      clearSelectionState();
      toolbar.hide();
      return;
    }

    const result = highlightWithNote(note, color, style);
    if (!result) {
      toolbar.hide();
      return;
    }

    notes.upsertNote(result.id, note);

    sendCreate(buildCreatePayload(result, color, style, note));
    toolbar.hide();
  };

  const onDelete = () => {
    const id = toolbar.toolbarState.highlightId;
    if (!id) {
      return;
    }

    removeHighlight(id);
    sendDelete(id);

    toolbar.hide();
  };

  const onClose = () => {
    clearSelectionState();
    toolbar.hide();
  };

  const onEditNote = (note: string) => {
    const id = viewer.viewerState.highlightId;
    if (!id) {
      return;
    }

    notes.upsertNote(id, note);

    sendUpdateNote({ id, note });

    viewer.hide();
  };

  return (
    <>
      <Toolbar
        visible={toolbar.toolbarState.visible}
        x={toolbar.toolbarState.x}
        y={toolbar.toolbarState.y}
        canHighlight={toolbar.toolbarState.canHighlight}
        canDelete={toolbar.toolbarState.highlightId !== null}
        initialNote={(toolbar.toolbarState.highlightId && notes.notes.get(toolbar.toolbarState.highlightId)) || ""}
        onHighlight={onHighlight}
        onRestyle={onRestyle}
        onDelete={onDelete}
        onAddNote={onAddNote}
        onSaveNote={onSaveNote}
        onClose={onClose}
      />
      <NoteViewer
        visible={viewer.viewerState.visible}
        x={viewer.viewerState.x}
        y={viewer.viewerState.y}
        note={viewer.viewerState.note}
        onSave={onEditNote}
        onMouseEnter={viewer.clearHideTimer}
        onMouseLeave={viewer.scheduleHide}
      />
    </>
  );
};

ReactDOM.createRoot(mountPoint).render(
  <React.StrictMode>
    <HighlighterRoot />
  </React.StrictMode>,
);
