import { createContext, useContext } from "react";
import type { Highlight, HighlightStyle } from "../../shared/types";

export interface HighlightsContextValue {
  highlights: Highlight[];
  loading: boolean;
  updateHighlight: (id: string, color: string, style: HighlightStyle) => void;
  updateNote: (id: string, note: string) => void;
  deleteHighlight: (id: string) => void;
}

export const HighlightsContext = createContext<HighlightsContextValue | null>(null);

export const useHighlights = (): HighlightsContextValue => {
  const context = useContext(HighlightsContext);
  if (!context) {
    throw new Error("useHighlights must be used inside <HighlightsProvider>");
  }
  return context;
};
