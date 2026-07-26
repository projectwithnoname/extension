import { useState } from "react";
import "./Style.scss";
import type { Highlight, HighlightStyle } from "../../../shared/types";
import Button from "../../../shared/components/button/Button";
import { NavigateToHiglight } from "../../../shared/messaging";
import Icon from "../../../shared/components/icon/Icon";
import { useHighlights } from "../../hooks/useHighlights";
import { PALETTE_COLORS } from "../../../content/palette/paletteOptions";

const STYLE_OPTIONS: { value: HighlightStyle; label: string }[] = [
  { value: "default", label: "Highlight" },
  { value: "underline", label: "Underline" },
  { value: "wave", label: "Wavy" },
  { value: "strike", label: "Strike" },
];

const HighlightItem = (props: Highlight) => {
  const { id, url, timestamp, color, text, note, title, favicon, style } = props;

  const handleNavigate = () => {
    NavigateToHiglight({ id: id, url: url });
  };

  const { deleteHighlight, updateNote, updateHighlight } = useHighlights();

  const [isEditing, setIsEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState(note ?? "");
  const [colorDraft, setColorDraft] = useState(color);
  const [styleDraft, setStyleDraft] = useState<HighlightStyle>(style);

  const handleEditToggle = () => {
    setNoteDraft(note ?? "");
    setColorDraft(color);
    setStyleDraft(style);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setNoteDraft(note ?? "");
    setColorDraft(color);
    setStyleDraft(style);
    setIsEditing(false);
  };

  const handleSave = async () => {
    await updateNote(id, noteDraft);

    //cheap fix to a race condition, should get fixed later...
    await new Promise((resolve) => setTimeout(resolve, 50));

    await updateHighlight(id, colorDraft, styleDraft);

    setIsEditing(false);
  };

  const date = new Date(timestamp).toLocaleDateString();
  const textBuilttStyles = buildHighlightCss(colorDraft, styleDraft);

  return (
    <div className={`highlightItem${isEditing ? " editing" : ""}`}>
      <div className="header">
        <img src={favicon} alt="Favicon" className="favicon" />
        <h3 onClick={handleNavigate}>{title}</h3>
      </div>
      <p className={`text${isEditing ? " dimmed" : ""}`} style={textBuilttStyles}>
        {text}
      </p>
      {!isEditing && note && (
        <div className="noteWrapper">
          <Icon name="comment-lines" size={14} />
          <p>{note}</p>
        </div>
      )}

      {isEditing && (
        <div className="editForm">
          <div className="colorPicker">
            {PALETTE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`colorSwatch${colorDraft === color ? " selected" : ""}`}
                style={{ background: color }}
                onClick={() => setColorDraft(color)}
                aria-label={`Set highlight color ${color}`}
              />
            ))}
          </div>
          <div className="stylePicker">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                className={`styleSwatch${styleDraft === opt.value ? " selected" : ""}`}
                onClick={() => setStyleDraft(opt.value)}
                aria-label={opt.label}
              >
                <span className="styleSwatchPreview" style={buildHighlightCss(colorDraft, opt.value)}>
                  Aa
                </span>
              </button>
            ))}
          </div>
          <textarea
            className="noteTextarea"
            placeholder="Add a note..."
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <div className="actionsContainer">
        <div className="infoContainer">
          <span className="colorBadge" style={{ background: colorDraft }}></span>
          <span className="dateStamp">{date}</span>
        </div>

        {isEditing ? (
          <div className="actions">
            <Button size="xs" type="tonal" palette="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="xs" type="tonal" palette="primary" onClick={handleSave}>
              Save
            </Button>
          </div>
        ) : (
          <div className="actions">
            <Button onClick={handleEditToggle} iconOnly size="xs" type="tonal" palette="secondary">
              <Icon name="marker" size={14} />
            </Button>
            <Button onClick={() => deleteHighlight(id)} iconOnly size="xs" type="outline" palette="secondary">
              <Icon name="delete" size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HighlightItem;

const buildHighlightCss = (color: string, style: HighlightStyle | undefined): React.CSSProperties => {
  switch (style) {
    case "underline":
      return {
        display: "inline",
        textDecorationLine: "underline",
        textDecorationStyle: "solid",
        textDecorationColor: color,
        textDecorationThickness: "1.5px",
      };
    case "wave":
      return {
        display: "inline",
        textDecorationLine: "underline",
        textDecorationStyle: "wavy",
        textDecorationColor: color,
      };
    case "strike":
      return {
        display: "inline",
        textDecorationLine: "line-through",
        textDecorationColor: color,
        textDecorationThickness: "1.5px",
      };
    default:
      return {};
  }
};
