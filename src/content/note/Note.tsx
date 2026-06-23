import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Button from "../../shared/components/button/Button";

interface NoteProps {
  show: boolean;
  initialValue?: string;
  onCancel: () => void;
  onSave: (note: string) => void;
}

interface NoteState {
  open: boolean;
  value: string;
  prevShow: boolean;
}

const Note = (props: NoteProps) => {
  const { show, initialValue = "", onCancel, onSave } = props;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [noteState, setNoteState] = useState<NoteState>({
    open: false,
    value: initialValue,
    prevShow: show,
  });

  if (show !== noteState.prevShow) {
    setNoteState({
      ...noteState,
      prevShow: show,
      value: show ? initialValue : noteState.value,
      open: show ? noteState.open : false,
    });
  }

  useEffect(() => {
    if (!show) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setNoteState({
        ...noteState,
        open: true,
      });

      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        const end = textarea.value.length;
        textarea.setSelectionRange(end, end);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [show]);

  /*
   * The UI lives in a closed Shadow DOM, which isolates styles but not events:
   * keystrokes still bubble out to the host page's document, where global
   * shortcuts (e.g. "f" to search) fire — and because the closed shadow root
   * retargets event.target to our host element, the page never realises the
   * user is typing in a field. Stop key events at the textarea so they never
   * leave the note while it is open.
   */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const stopEvent = (event: Event) => {
      event.stopPropagation();
    };

    textarea.addEventListener("keydown", stopEvent);
    textarea.addEventListener("keyup", stopEvent);
    textarea.addEventListener("keypress", stopEvent);

    return () => {
      textarea.removeEventListener("keydown", stopEvent);
      textarea.removeEventListener("keyup", stopEvent);
      textarea.removeEventListener("keypress", stopEvent);
    };
  }, [show]);

  if (!show) {
    return null;
  }

  const handleSave = () => {
    if (noteState.value.trim() === "") {
      return;
    }
    onSave(noteState.value);
  };

  const handleValueChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteState({
      ...noteState,
      value: event.target.value,
    });
  };

  return (
    <div id="noteContainer" className={noteState.open ? "noteContainer--open" : ""}>
      <textarea
        ref={textareaRef}
        placeholder="Add your note here..."
        rows={4}
        value={noteState.value}
        onChange={handleValueChange}
      ></textarea>
      <div className="noteContainerActions">
        <Button palette="secondary" type="default" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          palette="primary"
          type="default"
          size="sm"
          disabled={noteState.value.trim() === ""}
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default Note;
