import { useEffect, useState } from "react";
import Icon from "../../../shared/components/icon/Icon";
import SegmentPicker from "../../../shared/components/segmentPicker/SegmentPicker";
import SegmentPickerItem from "../../../shared/components/segmentPicker/SegmentPickerItem";
import type { ViewId } from "../../../shared/types";
import { useFilters } from "../../context/FilterContext";
import "./Styles.scss";
import Button from "../../../shared/components/button/Button";
interface HeaderProps {
  activeView: ViewId;
  onSelect: (id: ViewId) => void;
}

const tabs: { id: ViewId; label: string }[] = [
  { id: "page", label: "Page" },
  { id: "tree", label: "Tree" },
  { id: "shared", label: "Shared" },
];

const Header = ({ activeView, onSelect }: HeaderProps) => {
  const { setScope, setSearchTerm } = useFilters();

  const [draft, setDraft] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchTerm(draft.length > 2 ? draft : "");
    }, 200);
    return () => clearTimeout(handle);
  }, [draft, setSearchTerm]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.currentTarget.value);
  };

  const handleClearSearch = () => {
    setDraft("");
    setSearchTerm("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleClearSearch();
      e.currentTarget.blur();
    }
  };

  return (
    <header id="sidePanelHeader">
      <section className="tabs">
        {tabs.map((tab) => (
          <div key={tab.id} className={tab.id === activeView ? "active tab" : "tab"} onClick={() => onSelect(tab.id)}>
            {tab.label}
          </div>
        ))}
      </section>

      <section className="sort">
        {activeView === "page" && (
          <SegmentPicker>
            <SegmentPickerItem label="This page" onMouseUp={() => setScope("page")} />
            <SegmentPickerItem label="This domain" onMouseUp={() => setScope("domain")} />
          </SegmentPicker>
        )}

        <div id="search">
          <div className="inputContainer">
            <Icon name="search-icon" size={14} />
            <input
              value={draft}
              onChange={handleSearchInput}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              type="text"
              name="search-box"
            />

            {draft && (
              <Button
                size="xs"
                iconOnly
                palette="secondary"
                type="tonal"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <Icon name="close" size={8} />
              </Button>
            )}
          </div>

          {/* ADD A DROPDOWN FOR FILLTERING HERE */}
          {/* <div></div> */}
        </div>
      </section>
    </header>
  );
};

export default Header;
