import React from 'react';
import { useState } from 'react';
import { useHighlights } from "../context/useHighlights"
import { useActivePage } from "../hooks/useActivePage"
import {filterByDomain} from "../../shared/utils"
import type {Highlight} from "../../shared/types"
import { useTheme } from '../context/ThemeContext';

const Page = () => {
  const currentPage = useActivePage();
  const { highlights} = useHighlights();

  console.log(highlights);
  const filteredHighlights = filterByDomain(currentPage, highlights );

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