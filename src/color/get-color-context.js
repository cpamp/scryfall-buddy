import { getOperatorContext } from "../shared/text-input/operator-token.js";
import {
  COLOR_TRIGGER_OPERATORS,
  COLOR_TRIGGER_SEPARATORS,
} from "./constants.js";

export function getColorContext(input) {
  return getOperatorContext(
    input,
    COLOR_TRIGGER_OPERATORS,
    COLOR_TRIGGER_SEPARATORS,
  );
}
