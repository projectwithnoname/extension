import { createContext, useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import type { ViewId, FilterScope } from "../../shared/types";
import { filterReducer, initialFilterState, type FilterState } from "../reducer/filterReducer";
import { filterActions } from "../constants";

interface FilterContextValue {
  state: FilterState;
  dispatch: React.Dispatch<any>;
  setSearchTerm: (value: string) => void;
  setScope: (value: FilterScope) => void;
  setSort: (value: FilterState["sortBy"]) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export const getDefaultScope = (viewId: ViewId): FilterScope => {
  if (viewId === "page") {
    return "page";
  }

  return "all"; //will change once we add shared views
};

export const FilterProvider = ({ children, activeView }: { children: ReactNode; activeView: ViewId }) => {
  const [state, dispatch] = useReducer(filterReducer, {
    ...initialFilterState,
    scope: getDefaultScope(activeView),
  });

  const value = useMemo(
    () => ({
      state,
      dispatch,
      setSearchTerm: (value: string) => dispatch({ type: filterActions.SET_SEARCH_TERM, payload: value }),
      setScope: (value: FilterScope) => dispatch({ type: filterActions.SET_SCOPE, payload: value }),
      setSort: (value: FilterState["sortBy"]) => dispatch({ type: filterActions.SET_SORT, payload: value }),
      resetFilters: () => dispatch({ type: filterActions.RESET_FILTERS }),
    }),
    [state],
  );
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

export const useFilters = () => {
  const context = useContext(FilterContext);

  if (!context) {
    throw new Error("useFilters must be used inside");
  }

  return context;
};
