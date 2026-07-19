import Icon from "../../../shared/components/icon/Icon";
import SegmentPicker from "../../../shared/components/segmentPicker/SegmentPicker";
import SegmentPickerItem from "../../../shared/components/segmentPicker/SegmentPickeritem";
import type {ViewId} from "../../../shared/types";
import { useFilters } from "../../context/FilterContext";
import "./Styles.scss";

interface HeaderProps
{
  activeView: ViewId;
  onSelect: (id: ViewId) => void;
}

const tabs: { id: ViewId; label: string }[] = [
  { id: "page", label: "Page" },
  { id: "tree", label: "Tree" },
  { id: "shared", label: "Shared" }
];

const Header = ({ activeView, onSelect }: HeaderProps) =>
{
  const { state,setScope} = useFilters();
  return (
    <header id="sidePanelHeader">
      <section className="tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={tab.id === activeView ? "active tab" : "tab"}
            onClick={() => onSelect(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </section>

      <section className="sort">
        {activeView === "page" && (
          <SegmentPicker>
            <SegmentPickerItem label="This page" onMouseUp={() => setScope(state.scope === "page" ? "domain" : "page")} />
            <SegmentPickerItem label="This domain" onMouseUp={() => setScope("domain")} />
          </SegmentPicker>
        )}

        <div id="search" onClick={() => setScope(state.scope === "page" ? "domain" : "page")}>
          <div className="inputContainer">
          <Icon name="search-icon" size={14} />
          <input placeholder="Search..." type="text" name="search-box" />
          </div>


        <div>filter</div>
        </div>


      </section>

    </header>
  );
};

export default Header
