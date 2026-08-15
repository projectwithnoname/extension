import { useMemo } from "react";
import { useHighlights } from "../hooks/useHighlights";
import { useActivePage } from "../hooks/useActivePage";
import { filterByPage, filterByDomain, searchHighlights } from "../../shared/utils";
import type { Highlight } from "../../shared/types";
import { useTheme } from "../context/ThemeContext";
import { useFilters } from "../context/FilterContext";
import HighlightItem from "../components/highlightItem/HighlightItem";
import Toggle from "../../shared/components/toggle/Toggle";
import Button from "../../shared/components/button/Button";
import Tooltip from "../../shared/components/tooltip/Tooltip";
import Icon from "../../shared/components/icon/Icon";
import EmptyState from "../../shared/components/emptyState/EmptyState";
import useToolbarEnabled from "../../shared/hooks/useToolbarEnabled";

const themeIcons = {
  system: "monitor",
  light: "sun",
  dark: "moon",
} as const;

const themeLabels = {
  system: "System theme",
  light: "Light theme",
  dark: "Dark theme",
} as const;

const Page = () => {
  const currentPage = useActivePage();
  const { highlights } = useHighlights();
  const { state } = useFilters();
  const { enabled: toolbarEnabled, setEnabled: setToolbarEnabled } = useToolbarEnabled();
  const { theme, toggleTheme } = useTheme();

  const relevantHighlights = useMemo(() => {
    let scopedHighlights: Highlight[] = highlights;

    if (state.scope === "page") {
      scopedHighlights = filterByPage(currentPage, highlights);
    } else if (state.scope === "domain") {
      scopedHighlights = filterByDomain(currentPage, highlights);
    }

    return searchHighlights(scopedHighlights, state.searchTerm);
  }, [state.scope, currentPage, highlights, state.searchTerm]);

  return (
    <div className="pageView">
      <div className="highlightList">
        {relevantHighlights.length > 0 ? (
          relevantHighlights.map((highlight: Highlight, index) => <HighlightItem key={index} {...highlight} />)
        ) : (
          <EmptyState message="No highlights on this page yet." />
        )}
      </div>

      <footer className="footer">
        <Toggle
          checked={toolbarEnabled}
          onChange={setToolbarEnabled}
          label={toolbarEnabled ? "Toolbar enabled" : "Toolbar disabled"}
        />

        <Tooltip text={themeLabels[theme]} position="left">
          <Button iconOnly type="tonal" size="sm" onClick={toggleTheme} ariaLabel={themeLabels[theme]}>
            <Icon name={themeIcons[theme]} size={16} />
          </Button>
        </Tooltip>
      </footer>
    </div>
  );
};

export default Page;
