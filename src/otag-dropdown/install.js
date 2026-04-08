import { mountDropdownDefinition } from "../shared/dropdown/mount-dropdown-definition.js";
import { otagDropdownDefinition } from "./config.js";

export function mountOtagDropdown() {
  return mountDropdownDefinition(otagDropdownDefinition);
}
