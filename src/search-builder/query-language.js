export const SEARCH_BUILDER_NODE_TYPE_GROUP = "group";
export const SEARCH_BUILDER_NODE_TYPE_CONDITION = "condition";
export const SEARCH_BUILDER_GROUP_MODE_ALL = "all";
export const SEARCH_BUILDER_GROUP_MODE_ANY = "any";
export const SEARCH_BUILDER_CONDITION_KIND_FIELD = "field";
export const SEARCH_BUILDER_CONDITION_KIND_TEXT = "text";
export const SEARCH_BUILDER_COMPARATORS = [
  ":",
  "=",
  "!=",
  "<",
  ">",
  "<=",
  ">=",
];

const COMPARATORS_BY_LENGTH = SEARCH_BUILDER_COMPARATORS.slice().sort(
  (left, right) => right.length - left.length,
);

let nextSearchBuilderNodeId = 0;

class SearchBuilderParseError extends Error {
  constructor(message, index) {
    super(message);
    this.name = "SearchBuilderParseError";
    this.index = index;
  }
}

function createNodeId() {
  nextSearchBuilderNodeId += 1;
  return `scryfall-search-builder-node-${nextSearchBuilderNodeId}`;
}

function isEscapedCharacter(value, index) {
  let backslashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) {
    backslashCount += 1;
  }

  return backslashCount % 2 === 1;
}

function isWrappedInQuotes(value) {
  return (
    value.length >= 2 &&
    value.startsWith('"') &&
    value.endsWith('"') &&
    !isEscapedCharacter(value, value.length - 1)
  );
}

function containsUnescapedQuote(value) {
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '"' && !isEscapedCharacter(value, index)) {
      return true;
    }
  }

  return false;
}

function unescapeQuotedValue(value) {
  return value.replace(/\\(["\\])/g, "$1");
}

function unwrapQuotedValue(value) {
  if (!isWrappedInQuotes(value)) {
    return value;
  }

  return unescapeQuotedValue(value.slice(1, -1));
}

function quoteSearchValue(value) {
  const stringValue = String(value ?? "");
  if (stringValue.length === 0) {
    return '""';
  }

  if (!/[\s()"]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function formatParseError(error) {
  if (error instanceof SearchBuilderParseError && Number.isInteger(error.index)) {
    return `${error.message} at character ${error.index + 1}.`;
  }

  return error?.message || "The query could not be parsed.";
}

function tokenizeSearchQuery(query) {
  const tokens = [];
  let index = 0;

  while (index < query.length) {
    const character = query[index];

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (character === "(") {
      tokens.push({
        end: index + 1,
        start: index,
        type: "lparen",
        value: character,
      });
      index += 1;
      continue;
    }

    if (character === ")") {
      tokens.push({
        end: index + 1,
        start: index,
        type: "rparen",
        value: character,
      });
      index += 1;
      continue;
    }

    const start = index;
    let inQuotes = false;

    while (index < query.length) {
      const nextCharacter = query[index];

      if (nextCharacter === '"' && !isEscapedCharacter(query, index)) {
        inQuotes = !inQuotes;
        index += 1;
        continue;
      }

      if (!inQuotes && (/\s/.test(nextCharacter) || nextCharacter === "(" || nextCharacter === ")")) {
        break;
      }

      index += 1;
    }

    if (inQuotes) {
      throw new SearchBuilderParseError("Unclosed quote", start);
    }

    const value = query.slice(start, index);
    tokens.push({
      end: index,
      start,
      type: /^or$/i.test(value) ? "or" : "term",
      value,
    });
  }

  return tokens;
}

function findComparator(value) {
  let inQuotes = false;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '"' && !isEscapedCharacter(value, index)) {
      inQuotes = !inQuotes;
      continue;
    }

    if (inQuotes) {
      continue;
    }

    for (const comparator of COMPARATORS_BY_LENGTH) {
      if (value.startsWith(comparator, index)) {
        return {
          comparator,
          index,
        };
      }
    }
  }

  return null;
}

function createConditionNode(condition) {
  return {
    id: createNodeId(),
    type: SEARCH_BUILDER_NODE_TYPE_CONDITION,
    ...condition,
  };
}

function createGroupNode(group) {
  return {
    id: createNodeId(),
    type: SEARCH_BUILDER_NODE_TYPE_GROUP,
    ...group,
    children: group.children.map(assignNodeIds),
  };
}

function assignNodeIds(node) {
  if (!node) {
    return null;
  }

  if (node.type === SEARCH_BUILDER_NODE_TYPE_GROUP) {
    return createGroupNode(node);
  }

  return createConditionNode(node);
}

function parseConditionToken(rawToken) {
  const negated = rawToken.startsWith("-") && rawToken.length > 1;
  const token = negated ? rawToken.slice(1) : rawToken;

  if (!token) {
    throw new SearchBuilderParseError("Expected a search rule", 0);
  }

  const comparatorMatch = findComparator(token);
  if (!comparatorMatch) {
    if (containsUnescapedQuote(token) && !isWrappedInQuotes(token)) {
      throw new SearchBuilderParseError(
        "Quotes must wrap the whole value",
        rawToken.indexOf('"'),
      );
    }

    return {
      kind: SEARCH_BUILDER_CONDITION_KIND_TEXT,
      negated,
      value: unwrapQuotedValue(token),
    };
  }

  const field = token.slice(0, comparatorMatch.index).trim().toLowerCase();
  const value = token.slice(comparatorMatch.index + comparatorMatch.comparator.length);

  if (!field) {
    throw new SearchBuilderParseError("Each rule needs a property", 0);
  }

  if (containsUnescapedQuote(field)) {
    throw new SearchBuilderParseError(
      "Quotes are only supported in values",
      rawToken.indexOf('"'),
    );
  }

  if (containsUnescapedQuote(value) && !isWrappedInQuotes(value)) {
    throw new SearchBuilderParseError(
      "Quotes must wrap the whole value",
      rawToken.indexOf('"'),
    );
  }

  return {
    comparator: comparatorMatch.comparator,
    field,
    kind: SEARCH_BUILDER_CONDITION_KIND_FIELD,
    negated,
    value: unwrapQuotedValue(value),
  };
}

function wrapExpressionInRootGroup(expression) {
  if (!expression) {
    return createEmptySearchBuilderTree();
  }

  if (expression.type === SEARCH_BUILDER_NODE_TYPE_GROUP) {
    return expression;
  }

  return {
    children: [expression],
    mode: SEARCH_BUILDER_GROUP_MODE_ALL,
    type: SEARCH_BUILDER_NODE_TYPE_GROUP,
  };
}

function createParser(tokens) {
  let cursor = 0;

  function peek() {
    return tokens[cursor] || null;
  }

  function consume(type) {
    const token = peek();
    if (!token || (type && token.type !== type)) {
      return null;
    }

    cursor += 1;
    return token;
  }

  function parsePrimary() {
    const token = peek();
    if (!token) {
      throw new SearchBuilderParseError("Expected a search rule", tokens.at(-1)?.end || 0);
    }

    if (token.type === "term") {
      consume("term");
      return {
        type: SEARCH_BUILDER_NODE_TYPE_CONDITION,
        ...parseConditionToken(token.value),
      };
    }

    if (token.type === "lparen") {
      consume("lparen");

      if (peek()?.type === "rparen") {
        throw new SearchBuilderParseError("Groups cannot be empty", token.start);
      }

      const expression = parseOrExpression();
      const closeToken = consume("rparen");

      if (!closeToken) {
        throw new SearchBuilderParseError("Missing closing parenthesis", token.start);
      }

      if (expression.type === SEARCH_BUILDER_NODE_TYPE_GROUP) {
        return expression;
      }

      return {
        children: [expression],
        mode: SEARCH_BUILDER_GROUP_MODE_ALL,
        type: SEARCH_BUILDER_NODE_TYPE_GROUP,
      };
    }

    if (token.type === "or") {
      throw new SearchBuilderParseError("Missing a rule before OR", token.start);
    }

    throw new SearchBuilderParseError("Unexpected closing parenthesis", token.start);
  }

  function parseAndExpression() {
    const children = [];

    while (cursor < tokens.length) {
      const token = peek();

      if (!token || token.type === "or" || token.type === "rparen") {
        break;
      }

      children.push(parsePrimary());
    }

    if (children.length === 0) {
      const token = peek();
      throw new SearchBuilderParseError(
        "Expected a search rule",
        token?.start ?? tokens.at(-1)?.end ?? 0,
      );
    }

    if (children.length === 1) {
      return children[0];
    }

    return {
      children,
      mode: SEARCH_BUILDER_GROUP_MODE_ALL,
      type: SEARCH_BUILDER_NODE_TYPE_GROUP,
    };
  }

  function parseOrExpression() {
    const children = [parseAndExpression()];

    while (peek()?.type === "or") {
      const operatorToken = consume("or");
      if (!peek() || peek()?.type === "rparen") {
        throw new SearchBuilderParseError("Missing a rule after OR", operatorToken.start);
      }

      children.push(parseAndExpression());
    }

    if (children.length === 1) {
      return children[0];
    }

    return {
      children,
      mode: SEARCH_BUILDER_GROUP_MODE_ANY,
      type: SEARCH_BUILDER_NODE_TYPE_GROUP,
    };
  }

  return {
    parse() {
      if (tokens.length === 0) {
        return createEmptySearchBuilderTree();
      }

      const expression = wrapExpressionInRootGroup(parseOrExpression());
      if (cursor < tokens.length) {
        const token = tokens[cursor];
        throw new SearchBuilderParseError(
          token.type === "rparen"
            ? "Unexpected closing parenthesis"
            : "Unexpected token",
          token.start,
        );
      }

      return assignNodeIds(expression);
    },
  };
}

function summarizeUnsupportedValues(values, label) {
  if (values.length === 0) {
    return "";
  }

  const list = values.slice(0, 3).map((value) => `"${value}"`).join(", ");
  const suffix = values.length > 3 ? ", and more" : "";
  return `${label} ${list}${suffix}`;
}

function findUnsupportedNodes(node, options, result = { comparators: [], fields: [] }) {
  if (!node) {
    return result;
  }

  if (node.type === SEARCH_BUILDER_NODE_TYPE_GROUP) {
    node.children.forEach((child) => findUnsupportedNodes(child, options, result));
    return result;
  }

  if (
    node.kind === SEARCH_BUILDER_CONDITION_KIND_FIELD &&
    options?.supportedComparators &&
    !options.supportedComparators.has(node.comparator)
  ) {
    result.comparators.push(node.comparator);
  }

  if (
    node.kind === SEARCH_BUILDER_CONDITION_KIND_FIELD &&
    options?.supportedFields &&
    !options.supportedFields.has(node.field)
  ) {
    result.fields.push(node.field);
  }

  return result;
}

function createUnsupportedMessage(result) {
  const segments = [
    summarizeUnsupportedValues(Array.from(new Set(result.fields)), "unknown fields"),
    summarizeUnsupportedValues(Array.from(new Set(result.comparators)), "unsupported comparators"),
  ].filter(Boolean);

  if (segments.length === 0) {
    return "This query cannot be edited safely in the visual builder.";
  }

  return `This query is valid, but the visual builder cannot safely edit ${segments.join(" and ")}.`;
}

export function createEmptySearchBuilderTree() {
  return {
    children: [],
    id: createNodeId(),
    mode: SEARCH_BUILDER_GROUP_MODE_ALL,
    type: SEARCH_BUILDER_NODE_TYPE_GROUP,
  };
}

export function createDefaultSearchBuilderCondition() {
  return {
    comparator: ":",
    field: "name",
    id: createNodeId(),
    kind: SEARCH_BUILDER_CONDITION_KIND_FIELD,
    negated: false,
    type: SEARCH_BUILDER_NODE_TYPE_CONDITION,
    value: "",
  };
}

export function createDefaultSearchBuilderGroup() {
  return {
    children: [createDefaultSearchBuilderCondition()],
    id: createNodeId(),
    mode: SEARCH_BUILDER_GROUP_MODE_ALL,
    type: SEARCH_BUILDER_NODE_TYPE_GROUP,
  };
}

export function parseSearchBuilderQuery(query, options = {}) {
  try {
    const parser = createParser(tokenizeSearchQuery(String(query ?? "")));
    const tree = parser.parse();
    const unsupportedNodes = findUnsupportedNodes(tree, options);

    if (unsupportedNodes.fields.length > 0 || unsupportedNodes.comparators.length > 0) {
      return {
        message: createUnsupportedMessage(unsupportedNodes),
        status: "not-representable",
        tree: null,
      };
    }

    return {
      message: "",
      status: "valid",
      tree,
    };
  } catch (error) {
    return {
      message: formatParseError(error),
      status: "invalid",
      tree: null,
    };
  }
}

export function serializeSearchBuilderTree(node, options = {}) {
  if (!node) {
    return "";
  }

  if (node.type === SEARCH_BUILDER_NODE_TYPE_CONDITION) {
    const prefix = node.negated ? "-" : "";
    if (node.kind === SEARCH_BUILDER_CONDITION_KIND_TEXT) {
      return `${prefix}${quoteSearchValue(node.value)}`.trim();
    }

    return `${prefix}${node.field}${node.comparator}${quoteSearchValue(node.value)}`.trim();
  }

  const renderedChildren = node.children
    .map((child) => ({
      child,
      text: serializeSearchBuilderTree(child, options),
    }))
    .filter((entry) => Boolean(entry.text));

  if (renderedChildren.length === 0) {
    return "";
  }

  const separator =
    node.mode === SEARCH_BUILDER_GROUP_MODE_ANY ? " or " : " ";
  const output = renderedChildren
    .map((entry) => {
      if (entry.child?.type === SEARCH_BUILDER_NODE_TYPE_GROUP) {
        return `(${entry.text})`;
      }

      return entry.text;
    })
    .join(separator);

  return options.wrapInParentheses === true ? `(${output})` : output;
}

export function validateSearchBuilderTree(node, options = {}) {
  const isRoot = options.isRoot !== false;

  if (!node) {
    return {
      isValid: false,
      message: "The visual builder is not available for this query.",
    };
  }

  if (node.type === SEARCH_BUILDER_NODE_TYPE_GROUP) {
    if (!isRoot && node.children.length === 0) {
      return {
        isValid: false,
        message: "Each nested group needs at least one rule.",
      };
    }

    for (const child of node.children) {
      const result = validateSearchBuilderTree(child, { isRoot: false });
      if (!result.isValid) {
        return result;
      }
    }

    return {
      isValid: true,
      message:
        node.children.length === 0
          ? "The query is empty. Add a rule or apply an empty search."
          : "",
    };
  }

  if (node.kind === SEARCH_BUILDER_CONDITION_KIND_FIELD && !node.field) {
    return {
      isValid: false,
      message: "Each rule needs a property.",
    };
  }

  if (
    node.kind === SEARCH_BUILDER_CONDITION_KIND_FIELD &&
    options.supportedFields &&
    !options.supportedFields.has(node.field)
  ) {
    return {
      isValid: false,
      message: "Choose a property from the list.",
    };
  }

  if (!String(node.value ?? "").trim()) {
    return {
      isValid: false,
      message: "Each rule needs a value.",
    };
  }

  return {
    isValid: true,
    message: "",
  };
}
