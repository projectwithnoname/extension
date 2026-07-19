import React from 'react';
import { useState } from 'react';
import { useHighlights } from "../hooks/useHighlights"
import { useActivePage } from "../hooks/useActivePage"
import {filterByPage, filterByDomain} from "../../shared/utils"
import type {Highlight} from "../../shared/types"
import { useTheme } from '../context/ThemeContext';

const Page = () => {
  const currentPage = useActivePage();
  const { highlights} = useHighlights();

  console.log(highlights);
  console.log("current page: ", currentPage);
  const filteredHighlights = filterByPage(currentPage, highlights );
  const filteredDomainHighlights = filterByDomain(currentPage, highlights);
  console.log("filtered highlights for current page: ", filteredDomainHighlights);

  //temp, not needed
  const { theme, toggleTheme } = useTheme();




  return (
    <div>
      <h2>Highlights tested</h2>
      <h3>{currentPage}</h3>

      {filteredHighlights.length > 0 ? (
        filteredHighlights.map((highlight: Highlight) => (
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