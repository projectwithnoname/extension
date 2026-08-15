import { useCallback, useMemo, useState } from "react";
import { useHighlights } from "../hooks/useHighlights";
import { useFilters } from "../context/FilterContext";
import { searchHighlights } from "../../shared/utils";
import DomainNode from "./tree/DomainNode";
import EmptyState from "../../shared/components/emptyState/EmptyState";
import { groupHighlightsByDomain } from "./tree/grouping";
import "./tree/Styles.scss";

const Tree = () => {
  const { highlights } = useHighlights();
  const { state } = useFilters();

  const searchTerm = state.searchTerm.trim();
  const isSearching = searchTerm.length > 0;

  const domains = useMemo(
    () => groupHighlightsByDomain(searchHighlights(highlights, state.searchTerm)),
    [highlights, state.searchTerm],
  );

  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const overrideKey = useCallback((key: string) => `${isSearching ? "search" : "browse"}:${key}`, [isSearching]);

  const isOpen = useCallback(
    (key: string) => overrides[overrideKey(key)] ?? isSearching,
    [overrides, overrideKey, isSearching],
  );

  const onToggle = useCallback(
    (key: string) =>
      setOverrides((prev) => {
        const namespaced = overrideKey(key);
        return { ...prev, [namespaced]: !(prev[namespaced] ?? isSearching) };
      }),
    [overrideKey, isSearching],
  );

  return (
    <div className="treeView">
      {domains.length > 0 ? (
        <ul className="treeRoot">
          {domains.map((domain) => (
            <DomainNode key={domain.key} domain={domain} isOpen={isOpen} onToggle={onToggle} />
          ))}
        </ul>
      ) : (
        <EmptyState message={isSearching ? "No highlights match your search." : "No highlights saved yet."} />
      )}
    </div>
  );
};

export default Tree;
