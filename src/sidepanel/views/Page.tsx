import { useMemo } from "react";
import { useHighlights } from "../hooks/useHighlights";
import { useActivePage } from "../hooks/useActivePage";
import { filterByPage, filterByDomain } from "../../shared/utils";
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
    if (state.scope === "page") {
      return filterByPage(currentPage, highlights);
    } else if (state.scope === "domain") {
      return filterByDomain(currentPage, highlights);
    } else {
      return highlights;
    }
  }, [state.scope, currentPage, highlights]);

  return (
    <div className="pageView">
      <div className="highlightList">
        {relevantHighlights.length > 0 ? (
          relevantHighlights.map((highlight: Highlight) => (
              <HighlightItem {...highlight} />
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
