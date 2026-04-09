export function findNodeAndParent(node, nodeId, parent = null) {
  if (!node) {
    return null;
  }

  if (node.id === nodeId) {
    return {
      node,
      parent,
    };
  }

  if (node.type !== "group") {
    return null;
  }

  for (const child of node.children) {
    const match = findNodeAndParent(child, nodeId, node);
    if (match) {
      return match;
    }
  }

  return null;
}
