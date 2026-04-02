import { getOperatorContext } from "../shared/text-input/operator-token.js";
import { OTAG_OPERATOR } from "./constants.js";

export function getOtagContext(input) {
  return getOperatorContext(input, OTAG_OPERATOR);
}
