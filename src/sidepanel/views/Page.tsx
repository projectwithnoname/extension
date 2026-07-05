import React from 'react';
import { useState } from 'react';
import { useHighlights } from "../context/useHighlights"
import { useActivePage } from "../hooks/useActivePage"
import {filterByDomain} from "../../shared/utils"
import type {Highlight} from "../../shared/types"

const Page = () => {
  const currentPage = useActivePage();
  const { highlights} = useHighlights();

  console.log(highlights);
  const filteredHighlights = filterByDomain(currentPage, highlights );




  return (
    <div>
      <h2>Highlights tested</h2>

      {filteredHighlights.length > 0 ? (
        filteredHighlights.map((highlight: Highlight) => (
          <div>
            <p>{highlight.text}</p>
          </div>
        ))
      ) : (
        <p>No highlights found.</p>
      )}
    </div>
  )
}

export default Page