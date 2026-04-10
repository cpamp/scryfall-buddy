const fs = require("fs/promises");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const docsSourceDir = path.join(projectRoot, "src", "docs");
const docsOutputDir = path.join(projectRoot, "docs");
const privacyPolicyPath = path.join(projectRoot, "PRIVACY.md");
const docsConfig = {
  repositoryUrl: "https://github.com/cpamp/scryfall-buddy",
  githubIssuesUrl: "https://github.com/cpamp/scryfall-buddy/issues",
  chromeExtensionUrl: "",
  firefoxExtensionUrl: "https://addons.mozilla.org/en-US/firefox/addon/scryfall-buddy/",
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function applyInlineMarkdown(markdown) {
  let html = escapeHtml(markdown);

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    return `<a href="${escapeHtml(href)}">${label}</a>`;
  });

  return html;
}

function renderMarkdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const trimmedLine = lines[index].trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    if (trimmedLine.startsWith("- ")) {
      const items = [];

      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }

      blocks.push(
        `<ul>${items
          .map((item) => `<li>${applyInlineMarkdown(item)}</li>`)
          .join("")}</ul>`,
      );
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push(
        `<h${level}>${applyInlineMarkdown(headingMatch[2])}</h${level}>`,
      );
      index += 1;
      continue;
    }

    const paragraphLines = [];
    while (index < lines.length) {
      const paragraphLine = lines[index].trim();
      if (!paragraphLine || paragraphLine.startsWith("- ")) {
        break;
      }
      if (/^#{1,6}\s+/.test(paragraphLine)) {
        break;
      }
      paragraphLines.push(paragraphLine);
      index += 1;
    }

    blocks.push(`<p>${applyInlineMarkdown(paragraphLines.join(" "))}</p>`);
  }

  return blocks.join("\n");
}

function replaceTemplateTokens(template, replacements) {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, token) => {
    if (!(token in replacements)) {
      throw new Error(`Missing docs replacement for ${match}`);
    }

    return replacements[token];
  });
}

async function buildDocs() {
  const [
    indexTemplate,
    privacyTemplate,
    styles,
    privacyPolicyMarkdown,
  ] = await Promise.all([
    fs.readFile(path.join(docsSourceDir, "index.html"), "utf8"),
    fs.readFile(path.join(docsSourceDir, "privacy.html"), "utf8"),
    fs.readFile(path.join(docsSourceDir, "styles.css"), "utf8"),
    fs.readFile(privacyPolicyPath, "utf8"),
  ]);

  const baseReplacements = {
    REPOSITORY_URL: docsConfig.repositoryUrl,
    GITHUB_ISSUES_URL: docsConfig.githubIssuesUrl,
    CHROME_EXTENSION_URL: docsConfig.chromeExtensionUrl,
    FIREFOX_EXTENSION_URL: docsConfig.firefoxExtensionUrl,
  };

  await fs.mkdir(docsOutputDir, { recursive: true });
  await Promise.all([
    fs.writeFile(
      path.join(docsOutputDir, "index.html"),
      replaceTemplateTokens(indexTemplate, baseReplacements),
      "utf8",
    ),
    fs.writeFile(
      path.join(docsOutputDir, "privacy.html"),
      replaceTemplateTokens(privacyTemplate, {
        ...baseReplacements,
        PRIVACY_POLICY_CONTENT: renderMarkdownToHtml(privacyPolicyMarkdown),
      }),
      "utf8",
    ),
    fs.writeFile(path.join(docsOutputDir, "styles.css"), styles, "utf8"),
  ]);
}

if (require.main === module) {
  buildDocs().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  buildDocs,
};
