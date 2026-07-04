import { useState } from "react";
import type { ComponentType } from "react";
import Header from "./components/header/Header";
import { HighlightsProvider } from "./context/HighlightsContext";
import { useHighlights } from "./context/useHighlights";
import "./styles.scss";
import Collaborate from "./views/Collaborate";
import Content from "./views/Content";
import Tree from "./views/Tree";
import { useActivePage } from "./hooks/useActivePage";

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

const views: Record<ViewId, ComponentType> = {
  content: Content,
  collaborate: Collaborate,
  tree: Tree
};

const SidePanel = () =>
{
  const [activeView, setActiveView] = useState<ViewId>("content");

  const ActiveComponent = views[activeView];

  // const currentPage = useActivePage();
  // console.log("Current page:", currentPage);

  return (
    <div id="sidePanelContainer">
      <HighlightsProvider>
        <Header activeView={activeView} onSelect={setActiveView} />
        <ActiveComponent />
        {/* <p>Current page: {currentPage}</p> */}
        {/* <HighlightList /> */}
      </HighlightsProvider>
    </div>
  );
};

export default SidePanel;