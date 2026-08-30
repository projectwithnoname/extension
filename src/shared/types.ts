// How a highlight decorates its text. "default" fills the background with the
// color; the others use the color as a text-decoration line and leave the
// background untouched.
export type HighlightStyle = "default" | "underline" | "wave" | "strike";

export interface Highlight {
  id: string;
  text: string;
  timestamp: number;
  url: string;
  context: string;
  color: string;
  style: HighlightStyle;
  note?: string;
  title?: string;
  favicon?: string;
}

export type ViewId = "page" | "shared" | "tree";

export type FilterScope = "page" | "domain" | "all";

export type WorkspaceAccess = "view" | "edit";

export interface SharedWorkspace {
  id: string;
  name: string;
  access: WorkspaceAccess;
  owned: boolean;
  ownerEmail: string | null;
  memberCount: number;
  highlightCount: number;
}
