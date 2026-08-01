import { useState } from "react";
import type { ComponentType } from "react";
import Header from "./components/header/Header";
import { HighlightsProvider } from "./context/HighlightsContext";
import { useState } from "react";
import type { ComponentType } from "react";
import Header from "./components/header/Header";
import { HighlightsProvider } from "./context/HighlightsContext";
import "./styles.scss";
import Shared from "./views/Shared";
import Page from "./views/Page";
import Tree from "./views/Tree";
import { ThemeProvider } from "./context/ThemeContext";
import type { ViewId } from "../shared/types";
import { FilterProvider } from "./context/FilterContext";
import { AuthProvider } from "./context/AuthContext";

const views: Record<ViewId, ComponentType> = {
  page: Page,
  shared: Shared,
  tree: Tree,
};

const SidePanel = () => {
  const [activeView, setActiveView] = useState<ViewId>("page");
  const [activeView, setActiveView] = useState<ViewId>("page");

  const ActiveComponent = views[activeView];
  const ActiveComponent = views[activeView];

  return (
    <div id="sidePanelContainer">
      <ThemeProvider>
        <AuthProvider>
          <HighlightsProvider>
            <FilterProvider activeView={activeView}>
              <Header activeView={activeView} onSelect={setActiveView} />
              <ActiveComponent />
            </FilterProvider>
          </HighlightsProvider>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
};

export default SidePanel;
