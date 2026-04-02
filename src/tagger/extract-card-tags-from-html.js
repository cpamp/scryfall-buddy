function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function extractCardTagSlug(href, sourceUrl) {
  if (!href) {
    return null;
  }

  let url;

  try {
    url = new URL(href, sourceUrl);
  } catch {
    return null;
  }

  const match = url.pathname.match(/^\/tags\/card\/([^/?#]+)/);

  if (!match) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

export function extractTaggerCardTagsFromDocument(documentNode, sourceUrl) {
  const tags = [];
  const seenSlugs = new Set();

  for (const icon of documentNode.querySelectorAll(".tagging-icon.icon-card")) {
    const row = icon.closest(".tag-row");

    if (!row) {
      continue;
    }

    const anchor = row.querySelector('.tag-row-flex a[href*="/tags/card/"]');
    const slug = extractCardTagSlug(anchor?.getAttribute("href"), sourceUrl);
    const name = normalizeWhitespace(anchor?.textContent || "");

    if (!slug || !name || seenSlugs.has(slug)) {
      continue;
    }

    seenSlugs.add(slug);
    tags.push({ name, slug });
  }

  return tags;
}

export function extractTaggerCardTagsFromHtml(html, sourceUrl) {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(html, "text/html");

  return extractTaggerCardTagsFromDocument(documentNode, sourceUrl);
}
