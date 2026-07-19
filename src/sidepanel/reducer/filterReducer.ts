import type { FilterScope } from "../../shared/types";

export interface FilterState {
  searchTerm: string;
  scope: FilterScope;
  sortBy: "default" | "oldest" | "alpha" | "position";
}

type FilterAction =
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_SCOPE"; payload: FilterScope }
  | { type: "SET_SORT"; payload: FilterState["sortBy"] }
  | { type: "RESET_FILTERS" };

export const initialFilterState: FilterState = {
  searchTerm: "",
  scope: "all",
  sortBy: "default",
};

export const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload };
    case "SET_SCOPE":
      return { ...state, scope: action.payload };
    case "SET_SORT":
      return { ...state, sortBy: action.payload };
    case "RESET_FILTERS":
      return initialFilterState;
    default:
      return state;
  }
};
