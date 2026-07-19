import { useState, useMemo } from 'react';
import { useHighlights } from "../hooks/useHighlights"
import { useActivePage } from "../hooks/useActivePage"
import {filterByPage, filterByDomain} from "../../shared/utils"
import type {Highlight} from "../../shared/types"
import { useTheme } from '../context/ThemeContext';
import { useFilters } from '../context/FilterContext';

const Page = () => {
  const currentPage = useActivePage();
  const { highlights} = useHighlights();
  const {state, setScope} = useFilters();

  console.log(highlights);
  console.log("current page: ", currentPage);
  //const filteredHighlights = filterByPage(currentPage, highlights );
  // const filteredDomainHighlights = filterByDomain(currentPage, highlights);
  // console.log("filtered highlights for current page: ", filteredDomainHighlights);

  //temp, not needed
  const { theme, toggleTheme } = useTheme();

  const relevantHighlights = useMemo(() => {
    console.log("Filtering highlights based on scope:", state.scope);
    if (state.scope === "page") {
      return filterByPage(currentPage, highlights);
    } else if (state.scope === "domain") {
      return filterByDomain(currentPage, highlights);
    } else {
      return highlights;
    }
  }, [state.scope, currentPage, highlights]);




  return (
    <div>
      <h2>Highlights tested</h2>
      <h3 onClick={() => setScope(state.scope === "page" ? "domain" : "page")}>
        {state.scope}
      </h3>

      {relevantHighlights.length > 0 ? (
        relevantHighlights.map((highlight: Highlight) => (
          <div>
            <p>{highlight.text}</p>
          </div>
        ))
      ) : (
        <p>No highlights found.</p>
      )}

        <footer className="footer">
          <button onClick={toggleTheme}>
            {theme}
          </button>
        </footer>
    </div>
  )
}

export default Page