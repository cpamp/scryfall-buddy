import { getOperatorContext } from "../shared/text-input/operator-token.js";
import { PROPERTY_TRIGGER_OPERATORS } from "./constants.js";

export function getPropertyContext(input) {
  return getOperatorContext(input, PROPERTY_TRIGGER_OPERATORS);
}
