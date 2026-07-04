import type { Highlight } from "./types";

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "gclsrc",
  "dclid",
  "ref",
  "ref_src",
  "_ga",
  "mc_cid",
  "mc_eid",
  "igshid",
  "feature",
  "share",
];

export function normalizeUrl(rawUrl: string): string {
  const u = new URL(rawUrl);

  u.hash = "";
  u.hostname = u.hostname.toLowerCase();
  if (u.protocol === "http:") {
    u.protocol = "https:";
  }

  TRACKING_PARAMS.forEach((p) => u.searchParams.delete(p));

  u.searchParams.sort();

  // normalize trailing slash
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
    u.pathname = u.pathname.slice(0, -1);
  }

  return u.toString();
}

// THIS WILL FAIL ON ANY SPA HAT USES #HASHES IN URL
// GMAIL, X.COM... FAILS
// POTENTIALLY ADD A CHECK FOR HASHES AND THEN NORMALIZE THEM AS WELL


export function filterByDomain(domain: string, list: Highlight[]): Highlight[] {
    return list.filter(item => item.url == domain)
}

export async function getCurrentPage(): Promise<string> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if(tab && tab.url) {
        return normalizeUrl(tab.url);
    }
    return "";
}