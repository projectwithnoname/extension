import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Highlight } from "../../shared/types";
import { sendUpdateHighlight, sendUpdateNote, sendDelete } from "../../shared/messaging";
import { HighlightsContext, type HighlightsContextValue } from "./useHighlights";

export const HighlightsProvider = ({ children }: { children: ReactNode }) =>
{
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() =>
  {
    chrome.storage.local.get("highlights", (result: { highlights?: Highlight[] }) =>
    {
      setHighlights(result.highlights ?? []);
      setLoading(false);
    });

    const handleChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) =>
    {
      if (area === "local" && changes.highlights)
      {
        setHighlights((changes.highlights.newValue as Highlight[]) ?? []);
      }
    };

    chrome.storage.onChanged.addListener(handleChange);
    return () => chrome.storage.onChanged.removeListener(handleChange);
  }, []);

  const value: HighlightsContextValue = {
    highlights,
    loading,
    // Mutators only send messages. The onChanged event above is what updates
    updateHighlight: (id, color, style) => sendUpdateHighlight({ id, color, style }),
    updateNote: (id, note) => sendUpdateNote({ id, note }),
    deleteHighlight: (id) => sendDelete(id),
  };

  return <HighlightsContext.Provider value={value}>{children}</HighlightsContext.Provider>;
};
