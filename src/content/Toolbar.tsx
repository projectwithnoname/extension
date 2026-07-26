import { useEffect, useRef, useState } from "react";
import Button from "../shared/components/button/Button";
import Icon from "../shared/components/icon/Icon";
import Tooltip from "../shared/components/tooltip/Tooltip";
import type { HighlightStyle } from "../shared/types";
import Note from "./note/Note";
import Palette from "./palette/Palette";
import { DEFAULT_HIGHLIGHT_COLOR, DEFAULT_HIGHLIGHT_STYLE } from "./palette/paletteOptions";

/**
 * The toolbar that menages the highlight, restyle, delete, and note actions for a selected text.
 */
interface ToolbarProps {
  visible: boolean;
  x: number;
  y: number;
  canHighlight: boolean;
  canDelete: boolean;
  initialNote: string;

  /**
   * Highlights the selected text with the specified color and style.
   *
   * @param color - the color to higlight the text.
   * @param style - they style to higlight the text.
   */
  onHighlight: (color: string, style: HighlightStyle) => void;

  /**
   * Handles the restyleing of an existing higlight. Sets the new color and style for the higlight.
   *
   * @param color - The new color for the higlight.
   * @param style - the new style for the higlight.
   */
  onRestyle: (color: string, style: HighlightStyle) => void;

  /**
   * Deletes the selected text.
   */
  onDelete: () => void;

  /**
   * Adds a new note.
   *
   * @returns A boolean indicating wheather the note can be added.
   */
  onAddNote: () => boolean;

  /**
   * Saves a note with the specified color and style.
   *
   * @param note - The note to save.
   * @param color - The color of the note.
   * @param style - The style of the note.
   *
   * @returns A boolean indicating whether the note was saved successfully.
   */
  onSaveNote: (note: string, color: string, style: HighlightStyle) => void;

  /**
   * Dismisses the toolbar entirely (when the user presses esc)
   */
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
};

interface PaletteState {
  show: boolean;
  color: string;
  style: HighlightStyle;
}

const Toolbar = ({
  visible,
  x,
  y,
  canHighlight,
  canDelete,
  initialNote,
  onHighlight,
  onRestyle,
  onDelete,
  onAddNote,
  onSaveNote,
  onClose,
}: ToolbarProps) => {
  const [showNote, setShowNote] = useState<boolean>(false);
  const [paletteState, setPaletteState] = useState<PaletteState>({
    show: false,
    color: DEFAULT_HIGHLIGHT_COLOR,
    style: DEFAULT_HIGHLIGHT_STYLE,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  /*
   * When the toolbar opens, move focus to its first control so it is reachable
   * by keyboard without tabbing through the whole host page restore focus to
   * wherever it was when the toolbar closes.
   */
  useEffect(() => {
    if (!visible) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const frame = requestAnimationFrame(() => {
      const [firstFocusable] = getFocusableElements(container);
      firstFocusable?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [visible]);

  /*
   * Keyboard behaviour for the open toolbar: Escape dismisses it, Tab/Shift+Tab
   * are trapped so focus cycles within the toolbar instead of escaping into the
   * host page. The listener runs in the capture phase so it still fires for keys
   * pressed inside the note textarea, which stops key propagation of its own.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!visible || !container) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = (container.getRootNode() as ShadowRoot).activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown, true);
    return () => container.removeEventListener("keydown", handleKeyDown, true);
  }, [visible, onClose]);

  if (!visible) {
    if (showNote) {
      setShowNote(false);
    }
    if (paletteState.show) {
      setPaletteState({
        ...paletteState,
        show: false,
      });
    }
    return null;
  }

  const handleAddNote = () => {
    if (!onAddNote()) {
      return;
    }
    setShowNote(true);
  };

  const handleCancelNote = () => {
    setShowNote(false);
  };

  const handleColorChange = (nextColor: string) => {
    setPaletteState((prev) => ({ ...prev, color: nextColor }));
    if (!canHighlight) {
      onRestyle(nextColor, paletteState.style);
    }
  };

  const handleStyleChange = (nextStyle: HighlightStyle) => {
    setPaletteState((prev) => ({ ...prev, style: nextStyle }));
    if (!canHighlight) {
      onRestyle(paletteState.color, nextStyle);
    }
  };

  return (
    <div
      id="toolbarComponent"
      ref={containerRef}
      style={{
        position: "fixed",
        left: x,
        bottom: `calc(100vh - ${y}px + 10px)`,
        transform: "translateX(-50%)",
        zIndex: 999999,
        pointerEvents: "auto",
      }}
    >
      <Palette
        show={paletteState.show && !showNote}
        color={paletteState.color}
        style={paletteState.style}
        onColorChange={handleColorChange}
        onStyleChange={handleStyleChange}
      />

      {!showNote && (
        <span id="actions">
          <div className="toolbarContainer" role="toolbar" aria-label="Highlight actions" aria-orientation="horizontal">
            {canHighlight && (
              <Tooltip text="Highlight" position="top">
                <Button
                  onClick={() => onHighlight(paletteState.color, paletteState.style)}
                  iconOnly
                  type="tonal"
                  size="md"
                  ariaLabel="Highlight"
                >
                  <Icon name="marker" size={16} />
                </Button>
              </Tooltip>
            )}

            <Tooltip text="Change Color" position="top">
              <Button
                iconOnly
                type="tonal"
                size="md"
                ariaLabel="Change color"
                ariaHasPopup
                ariaExpanded={paletteState.show}
                onClick={() => setPaletteState((prev) => ({ ...prev, show: !prev.show }))}
              >
                <Icon name="palette" size={16} />
              </Button>
            </Tooltip>

            <Tooltip text="Add Note" position="top">
              <Button
                iconOnly
                type="tonal"
                size="md"
                ariaLabel="Add note"
                ariaHasPopup
                ariaExpanded={showNote}
                onClick={handleAddNote}
              >
                <Icon name="comment-lines" size={16} />
              </Button>
            </Tooltip>

            {canDelete && (
              <Tooltip text="Delete" position="top">
                <Button iconOnly onClick={onDelete} type="tonal" size="md" ariaLabel="Delete">
                  <Icon name="delete" size={16} />
                </Button>
              </Tooltip>
            )}
          </div>
        </span>
      )}

      <Note
        show={showNote}
        initialValue={initialNote}
        onCancel={handleCancelNote}
        onSave={(note) => onSaveNote(note, paletteState.color, paletteState.style)}
      />
    </div>
  );
};

export default Toolbar;
