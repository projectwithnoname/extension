import { useState } from "react";
import Icon from "../../shared/components/icon/Icon";
import Note from "./Note";

interface NoteViewerProps {
  visible: boolean;
  x: number;
  y: number;
  note: string;
  onSave: (note: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

interface NoteViewerState {
  editing: boolean;
  prevNote: string;
  prevVisible: boolean;
}

const NoteViewer = (props: NoteViewerProps) => {
  const { visible, x, y, note, onSave, onMouseEnter, onMouseLeave } = props;

  const [noteViewerState, setNoteViewerState] = useState<NoteViewerState>({
    editing: false,
    prevNote: note,
    prevVisible: visible,
  });

  if (note !== noteViewerState.prevNote || visible !== noteViewerState.prevVisible) {
    setNoteViewerState({
      ...noteViewerState,
      prevNote: note,
      prevVisible: visible,
      editing: visible ? false : noteViewerState.editing,
    });
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      id="noteViewerComponent"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "fixed",
        left: x,
        // anchor by the bottom edge (10px above the highlight top) so the note grows upward and sits above the text instead of covering it
        bottom: `calc(100vh - ${y}px + 10px)`,
        transform: "translateX(-50%)",
        zIndex: 999999,
        pointerEvents: "auto",
      }}
    >
      {noteViewerState.editing ? (
        <Note
          show
          initialValue={note}
          onCancel={() => setNoteViewerState((prev) => ({ ...prev, editing: false }))}
          onSave={onSave}
        />
      ) : (
        <div className="noteViewerBubble">
          <textarea className="noteViewerText" value={note} readOnly rows={1} />
          <button
            type="button"
            className="noteViewerEdit"
            aria-label="Edit note"
            onClick={() => setNoteViewerState((prev) => ({ ...prev, editing: true }))}
          >
            <Icon name="edit" size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NoteViewer;
