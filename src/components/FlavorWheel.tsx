import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Core flavour categories and examples (2-tier simplified wheel)
const CATEGORIES = [
  { key: "fruity", label: "Fruity", color: "fill-primary/30", items: ["Green Apple", "Citrus", "Berries", "Tropical"] },
  { key: "smoky", label: "Smoky", color: "fill-primary/30", items: ["Smoke", "Peat", "Soot", "Tar"] },
  { key: "spicy", label: "Spicy", color: "fill-primary/30", items: ["Pepper", "Clove", "Cinnamon", "Nutmeg"] },
  { key: "sweet", label: "Sweet", color: "fill-primary/30", items: ["Honey", "Vanilla", "Caramel", "Toffee"] },
  { key: "malty", label: "Malty", color: "fill-primary/30", items: ["Malt", "Biscuit", "Cereal", "Bread"] },
  { key: "woody", label: "Woody", color: "fill-primary/30", items: ["Oak", "Cedar", "Cask", "Char"] },
  { key: "floral", label: "Floral", color: "fill-primary/30", items: ["Heather", "Rose", "Violet", "Blossom"] },
  { key: "nutty", label: "Nutty", color: "fill-primary/30", items: ["Almond", "Hazelnut", "Walnut", "Nougat"] },
] as const;

const RADIUS = 140;
const CENTER = RADIUS + 8;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "L", x, y,
    "Z",
  ].join(" ");
}

const FlavorWheel: React.FC = () => {
  const [active, setActive] = useState<string | null>(null);

  const segments = useMemo(() => {
    const anglePer = 360 / CATEGORIES.length;
    return CATEGORIES.map((cat, i) => ({
      key: cat.key,
      label: cat.label,
      d: describeArc(CENTER, CENTER, RADIUS, i * anglePer, (i + 1) * anglePer),
    }));
  }, []);

  const activeCategory = useMemo(() => CATEGORIES.find((c) => c.key === active), [active]);

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>The Language of Flavour</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div className="mx-auto">
            <svg width={CENTER * 2} height={CENTER * 2} role="img" aria-label="Interactive flavour wheel">
              <circle cx={CENTER} cy={CENTER} r={RADIUS - 64} className="fill-background stroke-border" />
              {segments.map((s, idx) => (
                <g key={s.key}
                  className="transition-opacity"
                  onMouseEnter={() => setActive(s.key)}
                  onMouseLeave={() => setActive((a) => (a === s.key ? null : a))}
                  onClick={() => setActive((a) => (a === s.key ? null : s.key))}
                >
                  <path d={s.d} className={`stroke-border ${active === s.key ? "fill-primary/40" : "fill-muted/60"}`} />
                  {/* Label */}
                  <text
                    x={CENTER}
                    y={CENTER}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="select-none"
                    transform={`rotate(${(idx * 360) / CATEGORIES.length + 360 / CATEGORIES.length / 2}, ${CENTER}, ${CENTER}) translate(0, -${RADIUS - 36})`}
                  >
                    <tspan className="text-xs fill-foreground/80">{CATEGORIES[idx].label}</tspan>
                  </text>
                </g>
              ))}
              <circle cx={CENTER} cy={CENTER} r={36} className="fill-primary/80" />
            </svg>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{activeCategory ? activeCategory.label : "Explore Flavours"}</h3>
              <p className="text-sm text-muted-foreground">
                {activeCategory
                  ? "Common descriptors you might perceive in this category. Click a slice to pin it."
                  : "Hover a slice to preview, click to pin and explore common descriptors."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(activeCategory?.items ?? ["Apple", "Vanilla", "Smoke", "Honey", "Pepper", "Oak"]).map((it) => (
                <Badge key={it} variant="secondary" className="hover-scale">{it}</Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlavorWheel;
