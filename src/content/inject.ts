import type { Highlight, HighlightStyle } from "../shared/types";
import { normalizeUrl } from "../shared/utils";
import commentIcon from "../../public/icons/comment-lines.svg?raw";

interface RenderToolbarCallback {
  (x: number, y: number, highlightId: string | null, canHighlight: boolean): void;
}
interface HideToolbarCallback {
  (): void;
}

// Id of the host element that holds our (closed) shadow root. Used to tell
// apart interactions with our own UI from interactions with the page.
const EXTENSION_HOST_ID = "my-extension-root";

let hideTimer: ReturnType<typeof setTimeout> | null = null;
// A frozen clone of the most recent page selection. We hold our own Range so it
// survives the page selection collapsing when the user focuses the note
// textarea (which lives in our shadow DOM).
let lastRange: Range | null = null;

// Highlights live in the host page DOM (not our shadow DOM) and are styled with
// inline styles, which cannot express a ::after. The note marker therefore needs
// a real stylesheet injected into the page once, keyed off `data-has-note`. The
// icon is drawn as a CSS mask (the SVG only supplies the shape) so its color
// comes from `background-color`, which a per-span `--note-marker-color` variable
// drives — letting the icon match the highlight color for the line styles while
// falling back to a dark fill for the default (background-filled) style.
const noteMarkerDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(commentIcon.replace(/currentColor/g, "#000"))}`;

let markerStyleInjected = false;

const ensureNoteMarkerStyle = () => {
  if (markerStyleInjected) {
    return;
  }
  markerStyleInjected = true;

  const style = document.createElement("style");
  style.id = "highlighter-note-marker-style";
  style.textContent = `span[data-has-note]::after {
  content: "";
  display: inline-block;
  width: 0.85em;
  height: 0.85em;
  margin-left: 2px;
  vertical-align: -0.12em;
  background-color: var(--note-marker-color, #1a1a1a);
  -webkit-mask-image: url("${noteMarkerDataUri}");
  mask-image: url("${noteMarkerDataUri}");
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}`;
  (document.head ?? document.documentElement).appendChild(style);
};

// Tint the note marker icon to match the highlight color for the line styles
// (which expose a text-decoration-color); the default style has none, so the
// variable is cleared and the icon keeps its standard dark fill.
const syncNoteMarkerColor = (span: HTMLSpanElement) => {
  const decorationColor = span.style.textDecorationColor;
  if (decorationColor) {
    span.style.setProperty("--note-marker-color", decorationColor);
  } else {
    span.style.removeProperty("--note-marker-color");
  }
};

const isEventFromExtension = (event: Event): boolean => {
  return event.composedPath().some((target) => target instanceof HTMLElement && target.id === EXTENSION_HOST_ID);
};

export const clearSelectionState = () => {
  lastRange = null;
  window.getSelection()?.removeAllRanges();
};

const clearHideTimer = () => {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
};

const scheduleHide = (hideToolbar: HideToolbarCallback) => {
  clearHideTimer();
  hideTimer = window.setTimeout(() => {
    hideTimer = null;
    hideToolbar();
  }, 120);
};

interface ToolbarPosition {
  x: number;
  y: number;
  highlightId: string | null;
  canHighlight: boolean;
}

// The id of an existing highlight the range overlaps — whether the selection
// sits entirely inside it or merely crosses into it. Lets the toolbar target
// the whole highlight (delete, note, recolor) instead of nesting a new one.
const getOverlappingHighlightId = (range: Range): string | null => {
  const container = range.commonAncestorContainer;
  const containerElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as Element);

  // The whole selection may live inside an existing highlight.
  const inside = containerElement?.closest("span[data-highlight-id]");
  if (inside) {
    return inside.getAttribute("data-highlight-id");
  }

  // Or it may only partially overlap a highlight nested below the common
  // ancestor; pick the first one the range intersects.
  const scope = containerElement ?? document.body;
  const overlapping = Array.from(scope.querySelectorAll("span[data-highlight-id]")).find((highlight) =>
    range.intersectsNode(highlight),
  );
  return overlapping?.getAttribute("data-highlight-id") ?? null;
};

const computeToolbarPosition = (range: Range): ToolbarPosition | null => {
  const rect = range.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  // When the selection overlaps an existing highlight, the toolbar acts on that
  // whole highlight; a new highlight cannot be created (which would nest).
  const highlightId = getOverlappingHighlightId(range);
  const canHighlight = highlightId === null;

  return { x: rect.left + rect.width / 2, y: rect.top, highlightId, canHighlight };
};

const getLiveSelectionRange = (): Range | null => {
  const selection = window.getSelection();

  if (!selection || selection.isCollapsed || selection.rangeCount === 0 || selection.toString().trim() === "") {
    return null;
  }

  return selection.getRangeAt(0);
};

const getSelectionToolbarPosition = (): ToolbarPosition | null => {
  const range = getLiveSelectionRange();
  return range ? computeToolbarPosition(range) : null;
};

const handleSelectionChange = (renderToolbar: RenderToolbarCallback, hideToolbar: HideToolbarCallback) => {
  const position = getSelectionToolbarPosition();

  if (!position) {
    // The selection is gone, so drop the frozen range too — otherwise a later
    // scroll could resurrect the toolbar from a stale position.
    lastRange = null;
    scheduleHide(hideToolbar);
    return;
  }

  clearHideTimer();
  renderToolbar(position.x, position.y, position.highlightId, position.canHighlight);
};

const handleReposition = (renderToolbar: RenderToolbarCallback) => {
  // Fall back to the frozen range so the toolbar keeps tracking the selection
  // while the note is open (focusing the textarea collapses the live selection)
  // and after Cancel until the toolbar is dismissed.
  const range = getLiveSelectionRange() ?? lastRange;

  if (!range) {
    return;
  }

  const position = computeToolbarPosition(range);

  if (!position) {
    return;
  }

  renderToolbar(position.x, position.y, position.highlightId, position.canHighlight);
};

export const setupHighlighter = (
  renderToolbar: RenderToolbarCallback,
  hideToolbar: HideToolbarCallback,
): (() => void) => {
  const handleMouseUp = (event: MouseEvent) => {
    // Clicks inside our own toolbar/note must not be treated as the page losing
    // its selection, otherwise interacting with the note hides the toolbar.
    if (isEventFromExtension(event)) {
      return;
    }

    handleSelectionChange(renderToolbar, hideToolbar);
    const selection = document.getSelection();
    if (selection && selection.rangeCount !== 0 && selection.toString().trim() !== "") {
      lastRange = selection.getRangeAt(0).cloneRange();
    }
  };

  let scrollFrame: number | null = null;
  const handleScroll = () => {
    if (scrollFrame !== null) {
      return;
    }
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = null;
      handleReposition(renderToolbar);
    });
  };

  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("scroll", handleScroll, { capture: true, passive: true });

  return () => {
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("scroll", handleScroll, { capture: true });
    if (scrollFrame !== null) {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = null;
    }
  };
};

const getTextNodesInRange = (range: Range): Array<{ node: Text; startOffset: number; endOffset: number }> => {
  const ancestor =
    range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement!
      : (range.commonAncestorContainer as Element);

  const walker = document.createTreeWalker(ancestor, NodeFilter.SHOW_TEXT);
  const result: Array<{ node: Text; startOffset: number; endOffset: number }> = [];

  let node: Text;
  while ((node = walker.nextNode() as Text)) {
    if (!range.intersectsNode(node)) continue;

    const startOffset = node === range.startContainer ? range.startOffset : 0;
    const endOffset = node === range.endContainer ? range.endOffset : node.length;

    if (startOffset === endOffset) continue;

    result.push({ node, startOffset, endOffset });
  }

  return result;
};

const extractContext = (range: Range): string => {
  const preRange = document.createRange();
  preRange.setStart(document.body, 0);
  preRange.setEnd(range.startContainer, range.startOffset);
  const before = preRange.toString().slice(-100);

  const postRange = document.createRange();
  postRange.setStart(range.endContainer, range.endOffset);
  postRange.setEnd(document.body, document.body.childNodes.length);
  const after = postRange.toString().slice(0, 100);

  return `${before}[[[${range.toString()}]]]${after}`;
};

// Inline styles for a highlight span. "default" fills the background (and forces
// readable black text); the line styles use the color as the decoration color
// and leave the background — and the page's own text color — untouched.
const buildHighlightCss = (color: string, style: HighlightStyle): string => {
  switch (style) {
    case "underline":
      return `display:inline; text-decoration-line:underline; text-decoration-style:solid; text-decoration-color:${color}; text-decoration-thickness:3px;`;
    case "wave":
      return `display:inline; text-decoration-line:underline; text-decoration-style:wavy; text-decoration-color:${color};`;
    case "strike":
      return `display:inline; text-decoration-line:line-through; text-decoration-color:${color}; text-decoration-thickness: 3px;`;
    default:
      return `display:inline; background-color:${color}; color:#000 !important;`;
  }
};

const wrapTextNodes = (
  nodes: Array<{ node: Text; startOffset: number; endOffset: number }>,
  id: string,
  color: string,
  style: HighlightStyle,
  hasNote = false,
) => {
  const spans: HTMLSpanElement[] = [];

  for (const { node, startOffset, endOffset } of nodes) {
    // Trim the tail first so startOffset is still valid for the original node
    if (endOffset < node.length) {
      node.splitText(endOffset);
    }

    const targetNode: Text = startOffset > 0 ? node.splitText(startOffset) : node;

    const span = document.createElement("span");
    span.dataset.highlightId = id;
    span.style.cssText = buildHighlightCss(color, style);

    targetNode.parentNode!.insertBefore(span, targetNode);
    span.appendChild(targetNode);
    spans.push(span);
  }

  // A highlight can span several text nodes (and thus several spans). Mark only
  // the last one so the note icon renders once, at the end of the highlight.
  if (hasNote && spans.length > 0) {
    ensureNoteMarkerStyle();
    const marker = spans[spans.length - 1];
    marker.dataset.hasNote = "true";
    syncNoteMarkerColor(marker);
  }
};

interface HighlightOptions {
  color: string;
  style: HighlightStyle;
  note?: string;
}

const highlightRange = (
  range: Range,
  options: HighlightOptions,
): { id: string; text: string; context: string } | null => {
  const text = range.toString().trim();
  if (!text) return null;

  const id = crypto.randomUUID();
  const context = extractContext(range);
  const nodes = getTextNodesInRange(range);

  wrapTextNodes(nodes, id, options.color, options.style, Boolean(options.note));

  return { id, text, context };
};

// Whether there is a captured selection the toolbar can act on. The note flow
// uses this to decide whether opening the note is meaningful.
export const hasActiveSelection = (): boolean => {
  return lastRange !== null && lastRange.toString().trim() !== "";
};

export const higlightSelectedText = (
  color: string,
  style: HighlightStyle,
): {
  id: string;
  text: string;
  context: string;
} | null => {
  if (!lastRange) return null;

  const result = highlightRange(lastRange, { color, style });
  clearSelectionState();

  return result;
};

export const highlightWithNote = (
  note: string,
  color: string,
  style: HighlightStyle,
): {
  id: string;
  text: string;
  context: string;
} | null => {
  if (!lastRange) return null;

  const result = highlightRange(lastRange, { color, style, note });
  clearSelectionState();

  return result;
};

// Recolor / restyle every span of an existing highlight in place. Used when the
// palette acts on a selection that overlaps a highlight (which has no Highlight
// button to apply through). The note marker, stored in the dataset, survives the
// cssText reset; its icon color is re-synced to the new style.
export const restyleHighlight = (id: string, color: string, style: HighlightStyle) => {
  document.querySelectorAll<HTMLSpanElement>(`span[data-highlight-id="${id}"]`).forEach((span) => {
    span.style.cssText = buildHighlightCss(color, style);
    if (span.dataset.hasNote) {
      syncNoteMarkerColor(span);
    }
  });
};

// Attach the note marker icon to an existing highlight, used when a note is
// added to a highlight that didn't have one. The marker renders once, on the
// last span of the (possibly multi-span) highlight.
export const markHighlightHasNote = (id: string) => {
  const spans = document.querySelectorAll<HTMLSpanElement>(`span[data-highlight-id="${id}"]`);
  if (spans.length === 0) {
    return;
  }

  ensureNoteMarkerStyle();
  spans.forEach((span) => delete span.dataset.hasNote);
  const marker = spans[spans.length - 1];
  marker.dataset.hasNote = "true";
  syncNoteMarkerColor(marker);
};

export const clearHighlightNoteMarker = (id: string) => {
  document.querySelectorAll<HTMLSpanElement>(`span[data-highlight-id="${id}"]`).forEach((span) => {
    delete span.dataset.hasNote;
    span.style.removeProperty("--note-marker-color");
  });
};

export const removeHighlight = (id: string) => {
  document.querySelectorAll(`span[data-highlight-id="${id}"]`).forEach((span) => {
    while (span.firstChild) {
      span.parentNode!.insertBefore(span.firstChild, span);
    }
    span.parentNode!.removeChild(span);
  });
};

export const reapplyHighlight = (highlight: Highlight) => {
  const { id, context, color, style } = highlight;

  if (document.querySelector(`span[data-highlight-id="${id}"]`)) {
    return;
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  const positions: number[] = [];
  let fullText = "";

  let node: Text;
  while ((node = walker.nextNode() as Text)) {
    if ((node.parentElement as HTMLElement)?.dataset?.highlightId) continue;
    positions.push(fullText.length);
    fullText += node.textContent ?? "";
    textNodes.push(node);
  }

  const openMarker = "[[[";
  const closeMarker = "]]]";
  const openIdx = context.indexOf(openMarker);
  const closeIdx = context.indexOf(closeMarker);

  let highlightStart = -1;

  if (openIdx !== -1 && closeIdx !== -1) {
    const before = context.slice(0, openIdx);
    const selectedText = context.slice(openIdx + openMarker.length, closeIdx);
    const after = context.slice(closeIdx + closeMarker.length);

    // Try full context match first
    const fullContextStr = before + selectedText + after;
    const matchIdx = fullText.indexOf(fullContextStr);
    if (matchIdx !== -1) {
      highlightStart = matchIdx + before.length;
    } else {
      // Fallback: match just the selected text with as much context as possible
      const withBefore = before.slice(-20) + selectedText;
      const fallbackIdx = fullText.indexOf(withBefore);
      if (fallbackIdx !== -1) {
        highlightStart = fallbackIdx + before.slice(-20).length;
      } else {
        highlightStart = fullText.indexOf(selectedText);
      }
    }
  }

  if (highlightStart === -1) {
    return;
  }

  const selectedText = context.slice(context.indexOf(openMarker) + openMarker.length, context.indexOf(closeMarker));
  const highlightEnd = highlightStart + selectedText.length;

  // Find which text nodes cover [highlightStart, highlightEnd]
  const affectedNodes: Array<{
    node: Text;
    startOffset: number;
    endOffset: number;
  }> = [];

  for (let i = 0; i < textNodes.length; i++) {
    const nodeStart = positions[i];
    const nodeEnd = nodeStart + (textNodes[i].textContent?.length ?? 0);

    if (nodeEnd <= highlightStart || nodeStart >= highlightEnd) continue;

    affectedNodes.push({
      node: textNodes[i],
      startOffset: Math.max(0, highlightStart - nodeStart),
      endOffset: Math.min(textNodes[i].length, highlightEnd - nodeStart),
    });
  }

  wrapTextNodes(affectedNodes, id, color, style ?? "default", Boolean(highlight.note));
};

export const loadPageHighlights = (): Promise<Highlight[]> => {
  return new Promise((resolve) => {
    chrome.storage.local.get("highlights", (result) => {
      const highlights: Highlight[] = (result.highlights as Highlight[]) ?? [];
      const currentUrl = normalizeUrl(location.href);
      const pageHighlights = highlights.filter((highlight) => highlight.url === currentUrl);
      pageHighlights.forEach(reapplyHighlight);
      resolve(pageHighlights);
    });
  });
};

interface StorageSyncCallback {
  (pageHighlights: Highlight[]): void;
}

// Reconcile the page DOM against a storage change. Diffs old vs new (scoped to
// this page's URL) and applies only what changed. All mutators are idempotent,
// so an echo of our OWN write (we mutate the DOM, send a message, then receive
// our own onChanged) is a harmless no-op. Returns a teardown that removes the
// listener.
export const setupStorageSync = (onSync: StorageSyncCallback): (() => void) => {
  let currentUrl: string;
  try {
    currentUrl = normalizeUrl(location.href);
  } catch {
    // Unsupported page (e.g. about:blank) — nothing to sync.
    return () => {};
  }

  const handleChange = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area !== "local" || !changes.highlights) {
      return;
    }

    const oldList = ((changes.highlights.oldValue as Highlight[]) ?? []).filter(
      (highlight) => highlight.url === currentUrl,
    );
    const newList = ((changes.highlights.newValue as Highlight[]) ?? []).filter(
      (highlight) => highlight.url === currentUrl,
    );

    const oldById = new Map(oldList.map((highlight) => [highlight.id, highlight]));
    const newById = new Map(newList.map((highlight) => [highlight.id, highlight]));

    // Deletions: in old, gone from new.
    oldById.forEach((_unused, id) => {
      if (!newById.has(id)) {
        removeHighlight(id);
      }
    });

    newById.forEach((next, id) => {
      const prev = oldById.get(id);

      // Additions: new highlight on this page (e.g. created in another tab).
      // reapplyHighlight is a no-op if the span already exists.
      if (!prev) {
        reapplyHighlight(next);
        return;
      }

      // Color / style change.
      if (prev.color !== next.color || prev.style !== next.style) {
        restyleHighlight(id, next.color, next.style ?? "default");
      }

      // Note added / removed.
      const hadNote = Boolean(prev.note);
      const hasNote = Boolean(next.note);
      if (!hadNote && hasNote) {
        markHighlightHasNote(id);
      } else if (hadNote && !hasNote) {
        clearHighlightNoteMarker(id);
      }
    });

    onSync(newList);
  };

  chrome.storage.onChanged.addListener(handleChange);
  return () => chrome.storage.onChanged.removeListener(handleChange);
};

interface ShowNoteCallback {
  (x: number, y: number, highlightId: string): void;
}

// Watches for the pointer entering a highlight so the caller can show that
// highlight's note. The caller decides whether a note actually exists for the
// id; we only report the hover and where to anchor the popover.
export const setupNoteHover = (showNote: ShowNoteCallback, hideNote: () => void): (() => void) => {
  const handleOver = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const span = target.closest("span[data-highlight-id]");
    if (!span) {
      return;
    }

    const id = span.getAttribute("data-highlight-id");
    if (!id) {
      return;
    }

    // A highlight can span several spans (one per text node/line). Anchor the
    // note to the top of the whole block, centered horizontally, so it sits
    // above the highlight instead of jumping to whichever span is hovered.
    const spans = document.querySelectorAll<HTMLSpanElement>(`span[data-highlight-id="${id}"]`);
    let top = Infinity;
    let left = Infinity;
    let right = -Infinity;
    spans.forEach((highlightSpan) => {
      const spanRect = highlightSpan.getBoundingClientRect();
      top = Math.min(top, spanRect.top);
      left = Math.min(left, spanRect.left);
      right = Math.max(right, spanRect.right);
    });

    showNote((left + right) / 2, top, id);
  };

  const handleOut = (event: MouseEvent) => {
    const related = event.relatedTarget;
    // Keep the note open while moving within the same highlight, or into our own
    // UI — the popover lives in the shadow DOM, so its events retarget to the host.
    if (
      related instanceof Element &&
      (related.closest("span[data-highlight-id]") || related.id === EXTENSION_HOST_ID)
    ) {
      return;
    }
    hideNote();
  };

  document.addEventListener("mouseover", handleOver);
  document.addEventListener("mouseout", handleOut);

  return () => {
    document.removeEventListener("mouseover", handleOver);
    document.removeEventListener("mouseout", handleOut);
  };
};

export const getSelectedHighlightId = (): string | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const node = selection.anchorNode;
  if (!node) return null;

  const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
  const span = el?.closest("span[data-highlight-id]");
  return span?.getAttribute("data-highlight-id") ?? null;
};

export const navigateToHighlight = (id: string) => {
  const spans = document.querySelectorAll<HTMLSpanElement>(`span[data-highlight-id="${id}"]`);
  const span = spans[0];

  if (!span) {
    return;
  }

  span.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
};

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SCROLL_TO_HIGHLIGHT") {
    navigateToHighlight(message.payload?.id);
  }
});