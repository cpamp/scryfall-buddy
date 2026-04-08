import { mountDropdownDefinition } from "../shared/dropdown/mount-dropdown-definition.js";
import { colorDropdownDefinition } from "./config.js";

export function mountColorDropdown() {
  return mountDropdownDefinition(colorDropdownDefinition);
}
