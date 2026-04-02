#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const TAGGER_HOME_URL = "https://tagger.scryfall.com/";
const TAGGER_GRAPHQL_URL = "https://tagger.scryfall.com/graphql";
const REQUEST_INTERVAL_MS = 5_000;
const DEFAULT_RETRY_DELAY_MS = 30_000;
const MAX_RETRIES = 5;
const DEFAULT_TAG_TYPE = "ORACLE_CARD_TAG";
const SEARCH_TAGS_QUERY = `
  query SearchTags($input: TagSearchInput!) {
    tags(input: $input) {
      page
      perPage
      results {
        name
        slug
        taggingCount
        description
      }
      total
    }
  }
`;

let lastRequestStartedAt = 0;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatTagTypeForFilename(tagType) {
  return tagType.toLowerCase().replace(/_/g, "-");
}

function getOutputFilePath(tagType) {
  const baseName = formatTagTypeForFilename(tagType).replace(/-tag$/, "-tags");

  return path.join(
    __dirname,
    "..",
    "data",
    `${baseName}.json`,
  );
}

function extractCsrfToken(html) {
  const match = html.match(/<meta name="csrf-token" content="([^"]+)"/);

  if (!match) {
    throw new Error("Could not find CSRF token on the Scryfall Tagger homepage.");
  }

  return match[1];
}

function extractSessionCookie(response) {
  const rawCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean);

  const sessionCookie = rawCookies.find((cookie) =>
    cookie.startsWith("_scryfall_tagger_session="),
  );

  if (!sessionCookie) {
    throw new Error("Could not find the Scryfall Tagger session cookie.");
  }

  return sessionCookie.split(";", 1)[0];
}

async function waitForRequestSlot() {
  const now = Date.now();
  const waitMs = REQUEST_INTERVAL_MS - (now - lastRequestStartedAt);

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  lastRequestStartedAt = Date.now();
}

function getRetryDelayMs(response) {
  const retryAfter = response.headers.get("retry-after");

  if (!retryAfter) {
    return DEFAULT_RETRY_DELAY_MS;
  }

  const seconds = Number.parseInt(retryAfter, 10);

  if (Number.isFinite(seconds)) {
    return Math.max(seconds * 1_000, REQUEST_INTERVAL_MS);
  }

  const retryAtMs = Date.parse(retryAfter);

  if (!Number.isNaN(retryAtMs)) {
    return Math.max(retryAtMs - Date.now(), REQUEST_INTERVAL_MS);
  }

  return DEFAULT_RETRY_DELAY_MS;
}

function buildPayload(tagType, page) {
  return {
    query: SEARCH_TAGS_QUERY,
    variables: {
      input: {
        type: tagType,
        name: null,
        page,
      },
    },
    operationName: "SearchTags",
  };
}

async function bootstrapSession() {
  await waitForRequestSlot();
  const response = await fetch(TAGGER_HOME_URL);

  if (!response.ok) {
    throw new Error(`Failed to load Scryfall Tagger homepage: ${response.status}`);
  }

  const html = await response.text();

  return {
    csrfToken: extractCsrfToken(html),
    sessionCookie: extractSessionCookie(response),
  };
}

async function fetchTagPage(session, tagType, page) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    await waitForRequestSlot();

    const response = await fetch(TAGGER_GRAPHQL_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        cookie: session.sessionCookie,
        origin: "https://tagger.scryfall.com",
        referer: TAGGER_HOME_URL,
        "x-csrf-token": session.csrfToken,
        "x-requested-with": "XMLHttpRequest",
      },
      body: JSON.stringify(buildPayload(tagType, page)),
    });

    if (response.status === 429) {
      const retryDelayMs = getRetryDelayMs(response);
      console.warn(
        `Page ${page} hit rate limiting on attempt ${attempt}/${MAX_RETRIES}. Waiting ${Math.ceil(retryDelayMs / 1_000)}s before retrying.`,
      );
      await sleep(retryDelayMs);
      continue;
    }

    if (response.status >= 500 && response.status < 600) {
      const retryDelayMs = Math.max(REQUEST_INTERVAL_MS * attempt, DEFAULT_RETRY_DELAY_MS);
      console.warn(
        `Page ${page} returned ${response.status} on attempt ${attempt}/${MAX_RETRIES}. Waiting ${Math.ceil(retryDelayMs / 1_000)}s before retrying.`,
      );
      await sleep(retryDelayMs);
      continue;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed to fetch page ${page}: ${response.status} ${response.statusText}\n${body}`,
      );
    }

    const body = await response.json();
    const tags = body?.data?.tags;

    if (!tags) {
      throw new Error(`Unexpected GraphQL response for page ${page}: ${JSON.stringify(body)}`);
    }

    return tags;
  }

  throw new Error(`Exceeded retry limit while fetching page ${page}.`);
}

async function fetchAllTags(tagType) {
  const session = await bootstrapSession();
  const seenTagKeys = new Set();
  const combinedTags = [];
  let page = 1;
  let totalPages = 1;
  let totalTags = 0;

  while (page <= totalPages) {
    const tagsPage = await fetchTagPage(session, tagType, page);

    totalTags = tagsPage.total;
    totalPages = Math.max(1, Math.ceil(tagsPage.total / tagsPage.perPage));

    for (const tag of tagsPage.results) {
      const dedupeKey = tag.slug || tag.name;

      if (seenTagKeys.has(dedupeKey)) {
        continue;
      }

      seenTagKeys.add(dedupeKey);
      combinedTags.push(tag);
    }

    console.log(
      `Fetched page ${page}/${totalPages} (${combinedTags.length}/${totalTags} unique tags collected).`,
    );

    page += 1;
  }

  return combinedTags;
}

async function main() {
  const tagType = process.argv[2] || DEFAULT_TAG_TYPE;
  const outputFilePath = getOutputFilePath(tagType);

  console.log(`Fetching Scryfall Tagger tags for ${tagType}...`);
  const tags = await fetchAllTags(tagType);

  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
  fs.writeFileSync(outputFilePath, `${JSON.stringify(tags, null, 2)}\n`, "utf8");

  console.log(`Wrote ${tags.length} tags to ${outputFilePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
