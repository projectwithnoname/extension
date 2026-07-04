import type { ViewId } from "../../SidePanel";
import "./Styles.scss";

interface HeaderProps
{
  activeView: ViewId;
  onSelect: (id: ViewId) => void;
}

const tabs: { id: ViewId; label: string }[] = [
  { id: "content", label: "Content" },
  { id: "collaborate", label: "Collaborate" },
  { id: "tree", label: "Tree" }
];

const Header = ({ activeView, onSelect }: HeaderProps) =>
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