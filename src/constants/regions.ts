export type LandscapeCategory =
  | "scotland"
  | "japan"
  | "ireland"
  | "american"
  | "canada"
  | "default";

export interface RegionLandscape {
  category: LandscapeCategory;
  imageUrl: string;
  gradientFallback: string;
}

/** Map normalized region strings to landscape categories */
const REGION_TO_CATEGORY: Record<string, LandscapeCategory> = {
  speyside: "scotland",
  highlands: "scotland",
  highland: "scotland",
  lowlands: "scotland",
  lowland: "scotland",
  campbeltown: "scotland",
  islay: "scotland",
  islands: "scotland",
  island: "scotland",
  scotland: "scotland",
  japan: "japan",
  japanese: "japan",
  ireland: "ireland",
  irish: "ireland",
  kentucky: "american",
  tennessee: "american",
  american: "american",
  bourbon: "american",
  indiana: "american",
  canada: "canada",
  canadian: "canada",
};

const LANDSCAPE_IMAGES: Record<LandscapeCategory, RegionLandscape> = {
  scotland: {
    category: "scotland",
    imageUrl: "/landscapes/scotland.png",
    gradientFallback: "linear-gradient(135deg, #2d5016 0%, #4a7c23 40%, #6b8e3f 100%)",
  },
  japan: {
    category: "japan",
    imageUrl: "",
    gradientFallback: "linear-gradient(135deg, #2d3a2d 0%, #4a5a4a 40%, #6b7b6b 100%)",
  },
  ireland: {
    category: "ireland",
    imageUrl: "",
    gradientFallback: "linear-gradient(135deg, #1a4a1a 0%, #2d6a2d 40%, #4a8a4a 100%)",
  },
  american: {
    category: "american",
    imageUrl: "",
    gradientFallback: "linear-gradient(135deg, #5a3e1a 0%, #7a5a2d 40%, #9a7a4a 100%)",
  },
  canada: {
    category: "canada",
    imageUrl: "",
    gradientFallback: "linear-gradient(135deg, #1a3a5a 0%, #2d5a7a 40%, #4a7a9a 100%)",
  },
  default: {
    category: "default",
    imageUrl: "",
    gradientFallback: "linear-gradient(135deg, hsl(35 40% 20%) 0%, hsl(35 50% 30%) 40%, hsl(35 30% 45%) 100%)",
  },
};

/** Get the landscape image/gradient for a whisky region */
export function getRegionLandscape(region: string): RegionLandscape {
  const normalized = region.toLowerCase().trim();

  // Try direct match
  const category = REGION_TO_CATEGORY[normalized];
  if (category) return LANDSCAPE_IMAGES[category];

  // Try substring match (e.g. "Islay, Scotland" contains "islay")
  for (const [key, cat] of Object.entries(REGION_TO_CATEGORY)) {
    if (normalized.includes(key)) return LANDSCAPE_IMAGES[cat];
  }

  return LANDSCAPE_IMAGES["default"];
}
