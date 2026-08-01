import Icon from "../../../shared/components/icon/Icon";
import HighlightItem from "../../components/highlightItem/HighlightItem";
import type { PageGroup } from "./grouping";
import type { TreeNodeState } from "./types";

interface PageNodeProps extends TreeNodeState {
  page: PageGroup;
}

const PageNode = ({ page, isOpen, onToggle }: PageNodeProps) => {
  const open = isOpen(page.key);

  return (
    <li className="treeNode pageNode">
      <button
        type="button"
        className={`nodeHeader${open ? " open" : ""}`}
        onClick={() => onToggle(page.key)}
        aria-expanded={open}
        title={page.path}
      >
        <Icon name="chevron-right" size={12} />
        <Icon name="link" size={16} />
        <span className="label">{page.path}</span>
      </button>

      {open && (
        <ul className="nodeChildren highlightList">
          {page.highlights.map((highlight) => (
            <li key={highlight.id}>
              <HighlightItem {...highlight} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export default PageNode;
