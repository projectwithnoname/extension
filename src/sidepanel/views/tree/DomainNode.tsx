import Icon from "../../../shared/components/icon/Icon";
import PageNode from "./PageNode";
import type { DomainGroup } from "./grouping";
import type { TreeNodeState } from "./types";

interface DomainNodeProps extends TreeNodeState {
  domain: DomainGroup;
}

const DomainNode = ({ domain, isOpen, onToggle }: DomainNodeProps) => {
  const open = isOpen(domain.key);

  return (
    <li className="treeNode domainNode">
      <button
        type="button"
        className={`nodeHeader${open ? " open" : ""}`}
        onClick={() => onToggle(domain.key)}
        aria-expanded={open}
        title={domain.domain}
      >
        <Icon name="chevron-right" size={12} />
        {domain.favicon ? <img className="favicon" src={domain.favicon} alt="" /> : <Icon name="globe" size={16} />}
        <span className="label">{domain.domain}</span>
      </button>

      {open && (
        <ul className="nodeChildren">
          {domain.pages.map((page) => (
            <PageNode key={page.key} page={page} isOpen={isOpen} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </li>
  );
};

export default DomainNode;
