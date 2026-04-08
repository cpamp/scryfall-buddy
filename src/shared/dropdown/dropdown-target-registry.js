const dropdownTargets = [];
const dropdownRoutes = new Map();

export function registerDropdownTarget(target) {
  const entry = { ...target };
  dropdownTargets.push(entry);

  return function unregisterDropdownTarget() {
    const index = dropdownTargets.indexOf(entry);
    if (index >= 0) {
      dropdownTargets.splice(index, 1);
    }
  };
}

export function initializeDropdownRoutes(definitions) {
  dropdownRoutes.clear();

  for (const definition of definitions) {
    for (const operatorName of definition.routeOperators || []) {
      dropdownRoutes.set(operatorName.toLowerCase(), definition.key);
    }
  }
}

export function getDropdownKeyForOperator(operatorName) {
  return dropdownRoutes.get(String(operatorName || "").toLowerCase()) || null;
}

export function triggerDropdown(input, options = {}) {
  const { dropdownKey = null, exceptKey = null } = options;
  const matchingTargets = dropdownKey
    ? dropdownTargets.filter((target) => target.key === dropdownKey)
    : dropdownTargets.filter((target) => {
        if (target.key === exceptKey) {
          return false;
        }

        return Boolean(target.resolveContext(input));
      });

  if (matchingTargets.length > 1) {
    throw new Error(
      `Multiple dropdowns matched the same input: ${matchingTargets
        .map((target) => target.key)
        .join(", ")}`,
    );
  }

  const [matchingTarget] = matchingTargets;

  for (const target of dropdownTargets) {
    if (target !== matchingTarget && typeof target.hide === "function") {
      target.hide();
    }
  }

  if (!matchingTarget) {
    return null;
  }

  matchingTarget.refresh(input);
  return matchingTarget.key;
}
