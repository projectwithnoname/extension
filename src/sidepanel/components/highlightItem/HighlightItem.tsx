
import "./Style.scss";
import type { Highlight } from "../../../shared/types";
import Button from "../../../shared/components/button/Button";
import { NavigateToHiglight } from "../../../shared/messaging";
interface HighlightItemProps extends Highlight {
  deleteHighlight?: (id: string) => void;
}

const HighlightItem = (props: HighlightItemProps) => {

  const handleNavigate = () => {
    NavigateToHiglight({id:props.id , url:props.url});
  }

  return <div className="highlightItem">
    <div className="header">
      <img src={props.favicon} alt="Favicon" className="favicon" />
        <h3 onClick={handleNavigate}>{props.title}</h3>
    </div>
    <p>{props.text}</p>
    {
      props.note && 
      <div className="noteWrapper">
        {props.note}
      </div>
    }

    <div className="actionsContainer">
      <span color=""></span>
      <span>{props.timestamp}</span>

      <div className="actions">
        <Button iconOnly size="sm" ></Button>
      </div>
    </div>
  </div>;
};

export default HighlightItem;
