import "./Styles.scss";
import Icon from "../../../shared/components/icon/Icon";
import type { SharedWorkspace } from "../../../shared/types";

const count = (value: number, noun: string) => `${value} ${value === 1 ? noun : `${noun}s`}`;

const WorkspaceItem = (props: SharedWorkspace) => {
  const { name, owned, ownerEmail, memberCount, highlightCount } = props;

  return (
    <div className="workspaceItem">
      <Icon name="globe" size={16} />

      <div className="details">
        <span className="name">{name}</span>

        <span className="meta">
          {owned ? count(memberCount, "member") : (ownerEmail ?? "Shared with you")} ·{" "}
          {count(highlightCount, "highlight")}
        </span>
      </div>

    </div>
  );
};

export default WorkspaceItem;
