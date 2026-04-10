import { mountDropdownDefinition } from "../shared/dropdown/mount-dropdown-definition.js";
import { symbolDropdownDefinition } from "./config.js";

export function mountSymbolDropdown() {
  return mountDropdownDefinition(symbolDropdownDefinition);
}
