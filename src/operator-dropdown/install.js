import { mountDropdownDefinition } from "../shared/dropdown/mount-dropdown-definition.js";
import { operatorDropdownDefinition } from "./config.js";

export function mountOperatorDropdown() {
  return mountDropdownDefinition(operatorDropdownDefinition);
}
