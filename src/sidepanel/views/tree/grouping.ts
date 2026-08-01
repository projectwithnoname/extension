import type { Highlight } from "../../../shared/types";
import { normalizeUrl } from "../../../shared/utils";

export interface PageGroup {
  key: string;
  url: string;
  path: string;
  highlights: Highlight[];
}

export interface DomainGroup {
  key: string;
  domain: string;
  favicon?: string;
  pages: PageGroup[];
}

const UNKNOWN_DOMAIN = "Unknown";

interface ParsedUrl {
  hostname: string;
  pageKey: string;
  path: string;
}

const parse = (rawUrl: string): ParsedUrl => {
  try {
    const normalized = normalizeUrl(rawUrl);
    const url = new URL(normalized);

    return {
      hostname: url.hostname,
      pageKey: normalized,
      path: `${url.pathname}${url.search}` || "/",
    };
  } catch {
    return { hostname: UNKNOWN_DOMAIN, pageKey: rawUrl, path: rawUrl };
  }
};

/**
 * Buckets highlights into domain -> page -> highlights, which is the shape the
 * three accordion layers render. Domains and pages are sorted alphabetically;
 * highlights within a page are newest first.
 */
export function groupHighlightsByDomain(highlights: Highlight[]): DomainGroup[] {
  const domains = new Map<string, DomainGroup>();
  const pages = new Map<string, PageGroup>();

  for (const highlight of highlights) {
    const { hostname, pageKey, path } = parse(highlight.url);

    let domain = domains.get(hostname);
    if (!domain) {
      domain = { key: hostname, domain: hostname, pages: [] };
      domains.set(hostname, domain);
    }

    if (!domain.favicon && highlight.favicon) {
      domain.favicon = highlight.favicon;
    }

    let page = pages.get(pageKey);
    if (!page) {
      page = { key: pageKey, url: highlight.url, path, highlights: [] };
      pages.set(pageKey, page);
      domain.pages.push(page);
    }

    page.highlights.push(highlight);
  }

  const grouped = [...domains.values()].sort((a, b) => a.domain.localeCompare(b.domain));

  for (const domain of grouped) {
    domain.pages.sort((a, b) => a.path.localeCompare(b.path));

    for (const page of domain.pages) {
      page.highlights.sort((a, b) => b.timestamp - a.timestamp);
    }
  }

  return grouped;
}
