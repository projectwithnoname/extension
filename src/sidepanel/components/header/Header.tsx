import type { ViewId, ViewTab } from "../../SidePanel";
import "./Styles.scss";

interface HeaderProps
{
  tabs: ViewTab[];
  activeView: ViewId;
  onSelect: (id: ViewId) => void;
}

const Header = ({ tabs, activeView, onSelect }: HeaderProps) =>
{
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
    </header>
  );
};

export default Header