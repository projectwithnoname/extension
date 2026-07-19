import { useState } from "react";
import type { ComponentType } from "react";
import Header from "./components/header/Header";
import { HighlightsProvider } from "./context/HighlightsContext";
import { useHighlights } from "./hooks/useHighlights";
import "./styles.scss";
import Shared from "./views/Shared";
import Page from "./views/Page";
import Tree from "./views/Tree";
import { useActivePage } from "./hooks/useActivePage";
import { ThemeProvider } from "./context/ThemeContext";
import type { ViewId } from "../shared/types";
import { FilterProvider } from "./context/FilterContext";

const HighlightList = () => {
  const { highlights, loading, updateNote, deleteHighlight } = useHighlights();

  if (loading) {
    return <p>Loading…</p>;
  }

  return (
    <div>
      {highlights.map((highlight) => (
        <div key={highlight.id}>
          <span>{highlight.text}</span>
          <button onClick={() => updateNote(highlight.id, `edited ${Date.now()}`)}>Edit note</button>
          <button onClick={() => deleteHighlight(highlight.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

const views: Record<ViewId, ComponentType> = {
  page: Page,
  shared: Shared,
  tree: Tree,
};

const SidePanel = () => {
  const [activeView, setActiveView] = useState<ViewId>("page");

  const ActiveComponent = views[activeView];

  return (
    <div id="sidePanelContainer">
      <ThemeProvider>
        <HighlightsProvider>
          <FilterProvider activeView={activeView}>
            <Header activeView={activeView} onSelect={setActiveView} />
            <ActiveComponent />
          </FilterProvider>
          {/* <p>Current page: {currentPage}</p> */}
          {/* <HighlightList /> */}
        </HighlightsProvider>
      </ThemeProvider>
    </div>
  );
};

export default SidePanel;
