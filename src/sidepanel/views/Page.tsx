import { useMemo } from "react";
import { useHighlights } from "../hooks/useHighlights";
import { useActivePage } from "../hooks/useActivePage";
import { filterByPage, filterByDomain, searchHighlights } from "../../shared/utils";
import type { Highlight } from "../../shared/types";
import { useTheme } from "../context/ThemeContext";
import { useFilters } from "../context/FilterContext";
import HighlightItem from "../components/highlightItem/HighlightItem";

const Page = () => {
  const currentPage = useActivePage();
  const { highlights } = useHighlights();
  const { state } = useFilters();
  //temp, not needed
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
          relevantHighlights.map((highlight: Highlight, index) => (
              <HighlightItem key={index} {...highlight} />
          ))
        ) : (
          <p>No highlights found.</p>
        )}
      </div>

      <footer className="footer">
        <button onClick={toggleTheme}>{theme}</button>
      </footer>
    </div>
  );
};

export default Page;
