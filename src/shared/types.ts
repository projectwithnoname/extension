export type HighlightStyle = "default" | "underline" | "wave" | "strike";

export interface HighlightAuthor {
  id: string;
  email: string;
}

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
  author?: HighlightAuthor;
}

export type ViewId = "page" | "shared" | "tree";

export type FilterScope = "page" | "domain" | "all";
