import { getDropdownKeyForOperator } from "../shared/dropdown/dropdown-target-registry.js";

export function formatOperatorSelection(item, context) {
  return {
    appendSpaceIfAtEnd: false,
    shouldTriggerMatchingDropdown: true,
    nextDropdownKey: getDropdownKeyForOperator(item.token),
    value: `${context.negation}${item.token}:`,
  };
}
