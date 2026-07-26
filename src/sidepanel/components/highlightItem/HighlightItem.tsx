
import "./Style.scss";
import type { Highlight, HighlightStyle } from "../../../shared/types";
import Button from "../../../shared/components/button/Button";
import { NavigateToHiglight } from "../../../shared/messaging";
import Icon from "../../../shared/components/icon/Icon";
import { useHighlights } from "../../hooks/useHighlights";
interface HighlightItemProps extends Highlight {
  deleteHighlight?: (id: string) => void;
}

const HighlightItem = (props: HighlightItemProps) => {

  const {id, url, timestamp, color, text, note, title, favicon, style} = props;

  const handleNavigate = () => {
    NavigateToHiglight({id:id , url:url});
  }

  const { deleteHighlight, updateNote } = useHighlights();


  const date = new Date(timestamp).toLocaleDateString();
  const textBuilttStyles = buildHighlightCss(color, style);

  return <div className="highlightItem">
    <div className="header">
      <img src={favicon} alt="Favicon" className="favicon" />
        <h3 onClick={handleNavigate}>{title}</h3>
    </div>
    <p className="text" style={textBuilttStyles}>{text}</p>
    {
      note && 
      <div className="noteWrapper">
        <Icon name="comment-lines" size={14}/>
        <p>
        {note}
        </p>
      </div>
    }

    <div className="actionsContainer">
      <div className="infoContainer">
        <span className="colorBadge" style={{background: color}}></span>
        <span className="dateStamp">{date}</span>

      </div>

      <div className="actions">
        <Button iconOnly size="xs" type="tonal" palette="secondary">
          <Icon name="marker" size={14}/>
        </Button>
        <Button 
          onClick={() => deleteHighlight(id)}
          iconOnly size="xs" type="outline" palette="secondary">
          <Icon name="delete" size={14}/>
        </Button>
      </div>
    </div>
  </div>;
};

export default HighlightItem;


const buildHighlightCss = (
  color: string,
  style: HighlightStyle | undefined
): React.CSSProperties => {
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