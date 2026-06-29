import { useState } from "react";
import type { ComponentType } from "react";
import Header from "./components/header/Header";
import { HighlightsProvider } from "./context/HighlightsContext";
import { useHighlights } from "./context/useHighlights";
import "./styles.scss";
import Collaborate from "./views/Collaborate";
import Content from "./views/Content";
import Tree from "./views/Tree";

const HighlightList = () =>
{
  const { highlights, loading, updateNote, deleteHighlight } = useHighlights();

  if (loading)
  {
    return <p>Loading…</p>;
  }

  return (
    <div>
      {highlights.map((highlight) => (
        <div key={highlight.id}>
          <span>{highlight.text}</span>
          <button onClick={() => updateNote(highlight.id, `edited ${Date.now()}`)}>
            Edit note
          </button>
          <button onClick={() => deleteHighlight(highlight.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export type ViewId = "content" | "collaborate" | "tree";

export interface ViewTab
{
  id: ViewId;
  label: string;
  component: ComponentType;
}

const contentViews: ViewTab[] = [
  {
    id: "content",
    label: "Content",
    component: Content
  },
  {
    id: "collaborate",
    label: "Collaborate",
    component: Collaborate
  },
  {
    id: "tree",
    label: "Tree",
    component: Tree
  }
];

function getViewComponent(activeView: ViewId): ComponentType
{
  for (const view of contentViews)
  {
    if (view.id === activeView)
    {
      return view.component;
    }
  }

  return Content;
}

const SidePanel = () =>
{
  const [activeView, setActiveView] = useState<ViewId>("content");

  const ActiveComponent = getViewComponent(activeView);

  return (
    <div id="sidePanelContainer">
      <HighlightsProvider>
        <Header
          tabs={contentViews}
          activeView={activeView}
          onSelect={setActiveView}
        />
        <ActiveComponent />
        <HighlightList />
      </HighlightsProvider>
    </div>
  );
};

export default SidePanel;