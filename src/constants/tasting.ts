export const FLAVORS = [
  { key: "green_apple", label: "Green Apple", color: "#4ade80" },
  { key: "vanilla", label: "Vanilla", color: "#fbbf24" },
  { key: "smoke", label: "Smoke", color: "#6b7280" },
  { key: "peat", label: "Peat", color: "#78716c" },
  { key: "honey", label: "Honey", color: "#f59e0b" },
  { key: "spice", label: "Spice", color: "#ef4444" },
  { key: "citrus", label: "Citrus", color: "#facc15" },
  { key: "chocolate", label: "Chocolate", color: "#92400e" },
  { key: "oak", label: "Oak", color: "#a16207" },
  { key: "caramel", label: "Caramel", color: "#d97706" },
  { key: "dried_fruit", label: "Dried Fruit", color: "#b45309" },
  { key: "floral", label: "Floral", color: "#c084fc" },
  { key: "nutty", label: "Nutty", color: "#a3a3a3" },
  { key: "pepper", label: "Pepper", color: "#dc2626" },
  { key: "malt", label: "Malt", color: "#ca8a04" },
  { key: "tropical", label: "Tropical", color: "#34d399" },
  { key: "berries", label: "Berries", color: "#e879f9" },
  { key: "sherry", label: "Sherry", color: "#9f1239" },
] as const;

export const INTENSITY_AXES = [
  { key: "fruit", label: "Fruit" },
  { key: "floral", label: "Floral" },
  { key: "oak", label: "Oak" },
  { key: "smoke", label: "Smoke" },
  { key: "spice", label: "Spice" },
] as const;

export const INTENSITY_LABELS = ["none", "", "medium", "", "pronounced"];

export const DEFAULT_INTENSITY: Record<string, number> = {
  fruit: 2,
  floral: 2,
  oak: 2,
  smoke: 2,
  spice: 2,
};

// Simple community palate distribution used as a preview for all whiskies
export const DEFAULT_COMMUNITY: Record<string, number> = {
  green_apple: 62,
  vanilla: 71,
  smoke: 54,
  peat: 49,
  honey: 58,
  spice: 52,
  citrus: 41,
  chocolate: 27,
  oak: 65,
  caramel: 46,
  dried_fruit: 39,
  floral: 22,
  nutty: 28,
  pepper: 31,
  malt: 44,
  tropical: 19,
  berries: 24,
};
