import { describe, it, expect, test, vi, afterEach } from "vitest";
import { filterByDomain, getCurrentPage, normalizeUrl } from "../../src/shared/utils";
import type { Highlight } from "../../src/shared/types";

describe("normalizeUrl", () =>
{

  it("removes tracking params while keeping the rest", () =>
  {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=newsletter&fbclid=abc123&feature=share";
    expect(normalizeUrl(url)).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });

  it("upgrades http to https", () =>
  {
    expect(normalizeUrl("http://example.com/article")).toBe("https://example.com/article");
  });

  it("lowercases the hostname", () =>
  {
    expect(normalizeUrl("https://EN.Wikipedia.ORG/wiki/Cat")).toBe("https://en.wikipedia.org/wiki/Cat");
  });

  it("strips a trailing slash from the path", () =>
  {
    expect(normalizeUrl("https://example.com/blog/post/")).toBe("https://example.com/blog/post");
  });

  it("keeps the root path slash", () =>
  {
    expect(normalizeUrl("https://example.com/")).toBe("https://example.com/");
  });

  it("sorts query params so equivalent urls match", () =>
  {
    expect(normalizeUrl("https://example.com/search?b=2&a=1")).toBe("https://example.com/search?a=1&b=2");
  });
});

describe("filterByDomain", () => {
  const dummyHighlights: Highlight[] = [
  {
    id: "1",
    text: "First highlight on example",
    timestamp: 1_700_000_000_000,
    url: "https://example.com/article",
    context: "First highlight on example in context",
    color: "#ffeb3b",
    style: "default",
  },
  {
    id: "2",
    text: "Second highlight on example",
    timestamp: 1_700_000_100_000,
    url: "https://example.com/blog/post",
    context: "Second highlight on example in context",
    color: "#ff5252",
    style: "underline",
    note: "Worth revisiting",
  },
  {
    id: "3",
    text: "Highlight on wikipedia",
    timestamp: 1_700_000_200_000,
    url: "https://en.wikipedia.org/wiki/Cat",
    context: "Highlight on wikipedia in context",
    color: "#69f0ae",
    style: "wave",
  },
  {
    id: "4",
    text: "Highlight on youtube",
    timestamp: 1_700_000_300_000,
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    context: "Highlight on youtube in context",
    color: "#40c4ff",
    style: "strike",
    note: "Check the timestamp",
  },
    {
    id: "5",
    text: "fifth highlight on example",
    timestamp: 1_700_000_100_000,
    url: "https://example.com/blog/post",
    context: "fifth highlight on example in context",
    color: "#ff5252",
    style: "underline",
    note: "Worth revisiting",
  },
];
  test("test should return higlights that were only on the curent dmain", () => {
    
    const dummyDomain: string = "https://example.com/blog/post"
    const expected:Highlight[] = [dummyHighlights[1], dummyHighlights[4]];
    const actual = filterByDomain(dummyDomain, dummyHighlights);

    expect(actual).toStrictEqual(expected);
  })


})

describe("getCurrentPage", () =>
{
  function stubChromeTabs(tabs: Array<{ url?: string }>)
  {
    const query = vi.fn().mockResolvedValue(tabs);
    vi.stubGlobal("chrome", { tabs: { query } });
    return query;
  }

  afterEach(() =>
  {
    vi.unstubAllGlobals();
  });

  test("returns the normalized url of the active tab", async () =>
  {
    stubChromeTabs([{ url: "http://Example.com/article/?utm_source=x" }]);

    const actual = await getCurrentPage();

    expect(actual).toBe("https://example.com/article");
  });

  test("queries the active tab in the current window", async () =>
  {
    const query = stubChromeTabs([{ url: "https://example.com" }]);

    await getCurrentPage();

    expect(query).toHaveBeenCalledWith({ active: true, currentWindow: true });
  });

  test("returns an empty string when there is no active tab", async () =>
  {
    stubChromeTabs([]);

    expect(await getCurrentPage()).toBe("");
  });

  test("returns an empty string when the tab has no url", async () =>
  {
    stubChromeTabs([{ url: undefined }]);

    expect(await getCurrentPage()).toBe("");
  });

});