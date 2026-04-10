export const SYMBOL_TRIGGER_OPERATORS = ["o", "oracle", "m", "mana"];

export const SYMBOL_CATEGORY_DEFINITIONS = [
  {
    description: "tap, colors, snow, and X",
    examples: ["{T}", "{W}", "{U}", "{B}"],
    key: "basic",
    label: "Basic",
  },
  {
    description: "zero through twenty generic mana",
    examples: ["{0}", "{1}", "{2}", "{20}"],
    key: "generic",
    label: "Generic",
  },
  {
    description: "two-color hybrid mana",
    examples: ["{W/U}", "{B/R}", "{G/W}"],
    key: "hybrid",
    label: "Hybrid",
  },
  {
    description: "phyrexian and hybrid phyrexian mana",
    examples: ["{W/P}", "{U/B/P}", "{R/W/P}"],
    key: "phyrexian",
    label: "Phyrexian",
  },
  {
    description: "2/color and colorless hybrid mana",
    examples: ["{2/W}", "{C/U}", "{C/G}"],
    key: "alternate",
    label: "Alt Costs",
  },
  {
    description: "energy, chaos, tickets, and more",
    examples: ["{E}", "{PW}", "{CHAOS}", "{TK}"],
    key: "special",
    label: "Special",
  },
];
