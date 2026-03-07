import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, X, Plus, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { FLAVORS } from "@/constants/tasting";

interface RateAndReviewProps {
  rating: number | null;
  onRatingChange: (rating: number) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  selectedFlavors: string[];
  onFlavorsChange: (flavors: string[]) => void;
  communityFlavors: Record<string, number>;
  whiskyImageUrl: string | null;
  whiskyName: string;
  onNext: () => void;
  onClose: () => void;
}

/* ── SVG Dial constants ── */
const RADIUS = 130;
const STROKE_WIDTH = 8;
const CENTER = RADIUS + STROKE_WIDTH + 20;
const SVG_SIZE = CENTER * 2;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  if (endAngle - startAngle >= 360) {
    const mid = polarToCartesian(cx, cy, r, startAngle + 180);
    const end = polarToCartesian(cx, cy, r, startAngle + 359.99);
    const start = polarToCartesian(cx, cy, r, startAngle);
    return `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${mid.x} ${mid.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;
  }
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export const RateAndReview = ({
  rating,
  onRatingChange,
  notes,
  onNotesChange,
  selectedFlavors,
  onFlavorsChange,
  communityFlavors,
  whiskyImageUrl,
  whiskyName,
  onNext,
  onClose,
}: RateAndReviewProps) => {
  // Visual mode: "dial" shows the rating circle, "review" shows expanded review
  const [mode, setMode] = useState<"dial" | "review">("dial");
  const [showFlavors, setShowFlavors] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasRating = rating !== null && rating > 0;

  /* ── Dial pointer logic ── */
  const ratingToAngle = (r: number) => (r / 5) * 360;

  const angleToRating = useCallback((angle: number): number => {
    let normalized = angle % 360;
    if (normalized < 0) normalized += 360;
    const raw = (normalized / 360) * 5;
    return Math.round(raw * 2) / 2 || 0.5;
  }, []);

  const getAngleFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return 0;
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      return angle;
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      (e.target as Element).setPointerCapture(e.pointerId);
      const angle = getAngleFromPointer(e.clientX, e.clientY);
      onRatingChange(angleToRating(angle));
    },
    [getAngleFromPointer, angleToRating, onRatingChange]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const angle = getAngleFromPointer(e.clientX, e.clientY);
      onRatingChange(angleToRating(angle));
    },
    [isDragging, getAngleFromPointer, angleToRating, onRatingChange]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /* ── Flavor logic ── */
  const toggleFlavor = (key: string) => {
    if (selectedFlavors.includes(key)) {
      onFlavorsChange(selectedFlavors.filter((f) => f !== key));
    } else {
      onFlavorsChange([...selectedFlavors, key]);
    }
  };

  const sortedCommunityFlavors = Object.entries(communityFlavors)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => {
      const meta = FLAVORS.find((f) => f.key === key);
      return { key, count, label: meta?.label || key, color: meta?.color || "#a3a3a3" };
    });

  /* ── Switch to review mode ── */
  const enterReviewMode = () => {
    setMode("review");
    setShowFlavors(true);
    // Focus textarea after transition
    setTimeout(() => textareaRef.current?.focus(), 350);
  };

  const enterDialMode = () => {
    setMode("dial");
    setShowFlavors(false);
  };

  /* ── Render helpers ── */
  const currentAngle = rating ? ratingToAngle(rating) : 0;
  const thumbPos = polarToCartesian(CENTER, CENTER, RADIUS, currentAngle);

  const ticks = [1, 2, 3, 4, 5].map((n) => {
    const angle = ratingToAngle(n);
    const outer = polarToCartesian(CENTER, CENTER, RADIUS + 14, angle);
    const inner = polarToCartesian(CENTER, CENTER, RADIUS + 6, angle);
    return { n, outer, inner, angle };
  });

  const ratingDisplay = rating
    ? rating % 1 === 0
      ? `${rating}`
      : rating.toFixed(1)
    : "";

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/50">
        <button
          onClick={mode === "review" ? enterDialMode : onClose}
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
        >
          {mode === "review" ? <ArrowLeft className="w-5 h-5" /> : <X className="w-6 h-6" />}
        </button>

        <span className="text-sm font-medium text-muted-foreground">
          {mode === "review" ? "Your Review" : ""}
        </span>

        {mode === "dial" && (
          <Button
            onClick={enterReviewMode}
            disabled={!hasRating}
            variant="ghost"
            className="font-semibold text-base -mr-2"
          >
            Done
          </Button>
        )}
        {mode === "review" && <div className="w-14" />}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        {/* ━━━ DIAL MODE ━━━ */}
        <div
          className="transition-all duration-300 ease-out overflow-hidden"
          style={{
            maxHeight: mode === "dial" ? "700px" : "0px",
            opacity: mode === "dial" ? 1 : 0,
            transform: mode === "dial" ? "translateY(0)" : "translateY(-20px)",
          }}
        >
          {/* Bottle thumbnail */}
          <div className="flex items-center gap-3 px-6 pt-3 pb-1">
            {whiskyImageUrl ? (
              <img src={whiskyImageUrl} alt="" className="h-12 w-8 object-contain rounded" />
            ) : (
              <div className="h-12 w-8 bg-muted/40 rounded" />
            )}
            <p className="text-sm text-muted-foreground font-medium truncate max-w-[220px]">
              {whiskyName}
            </p>
          </div>

          {/* Rating badge */}
          {hasRating && (
            <div className="flex justify-center mt-1 mb-2">
              <div className="flex items-center gap-2 bg-primary/10 rounded-full px-5 py-2">
                <Star className="w-6 h-6 text-primary fill-primary" />
                <span className="text-2xl font-bold">{ratingDisplay}</span>
              </div>
            </div>
          )}

          {/* SVG Dial */}
          <div className="flex justify-center px-6 pb-2">
            <svg
              ref={svgRef}
              width={SVG_SIZE}
              height={SVG_SIZE}
              viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
              className="touch-none select-none max-w-[280px] max-h-[280px] w-full h-auto"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Track */}
              <circle
                cx={CENTER} cy={CENTER} r={RADIUS}
                fill="none" stroke="hsl(var(--muted))" strokeWidth={STROKE_WIDTH}
              />
              {/* Active arc */}
              {hasRating && currentAngle > 0 && (
                <path
                  d={describeArc(CENTER, CENTER, RADIUS, 0, currentAngle)}
                  fill="none" stroke="hsl(var(--primary))" strokeWidth={STROKE_WIDTH} strokeLinecap="round"
                />
              )}
              {/* Tick marks */}
              {ticks.map(({ n, outer, inner }) => (
                <line key={n} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                  stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} opacity={0.4}
                />
              ))}
              {/* Half-position dots */}
              {Array.from({ length: 10 }, (_, i) => (i + 1) * 0.5).map((val) => {
                if (Number.isInteger(val)) return null;
                const pos = polarToCartesian(CENTER, CENTER, RADIUS + 10, ratingToAngle(val));
                return (
                  <circle key={val} cx={pos.x} cy={pos.y} r={1.5}
                    fill="hsl(var(--muted-foreground))" opacity={0.3}
                  />
                );
              })}
              {/* Center text */}
              {!hasRating && (
                <>
                  <text x={CENTER} y={CENTER - 8} textAnchor="middle" dominantBaseline="middle"
                    className="fill-foreground" fontSize="14" fontWeight="500">
                    Slide the star to
                  </text>
                  <text x={CENTER} y={CENTER + 12} textAnchor="middle" dominantBaseline="middle"
                    className="fill-muted-foreground" fontSize="14">
                    rate this whisky
                  </text>
                  <text x={CENTER} y={CENTER + 32} textAnchor="middle" dominantBaseline="middle"
                    className="fill-muted-foreground" fontSize="14">
                    out of five
                  </text>
                </>
              )}
              {/* Thumb */}
              {hasRating ? (
                <g transform={`translate(${thumbPos.x - 14}, ${thumbPos.y - 14})`}>
                  <circle cx={14} cy={14} r={18} fill="hsl(var(--primary))" opacity={0.2} />
                  <circle cx={14} cy={14} r={14} fill="hsl(var(--primary))" />
                  <path d="M14 5l2.5 5.5 6 .7-4.3 4.2 1 5.9L14 18.5l-5.2 2.8 1-5.9-4.3-4.2 6-.7z" fill="white" />
                </g>
              ) : (
                <g transform={`translate(${CENTER - 14}, ${CENTER - RADIUS - 14})`}>
                  <circle cx={14} cy={14} r={16} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <path d="M14 6l2.2 4.8 5.3.6-3.8 3.7.9 5.2L14 17.5l-4.6 2.8.9-5.2-3.8-3.7 5.3-.6z" fill="hsl(var(--primary))" />
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* ━━━ REVIEW TEXTAREA ━━━ (always in DOM, grows when in review mode) */}
        <div className="px-5 pt-3">
          {/* Rating badge (compact) — shown only in review mode */}
          <div
            className="transition-all duration-300 ease-out overflow-hidden"
            style={{
              maxHeight: mode === "review" ? "60px" : "0px",
              opacity: mode === "review" ? 1 : 0,
            }}
          >
            {hasRating && (
              <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 w-fit mb-4">
                <Star className="w-5 h-5 text-primary fill-primary" />
                <span className="text-lg font-bold">{ratingDisplay}</span>
              </div>
            )}
          </div>

          {/* Textarea — always visible */}
          <div
            className="transition-all duration-300 ease-out"
            style={{
              minHeight: mode === "review" ? "120px" : "52px",
            }}
          >
            <textarea
              ref={textareaRef}
              placeholder={mode === "dial" ? "What did you think?" : "Add your review..."}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              onFocus={() => {
                if (mode === "dial" && hasRating) enterReviewMode();
              }}
              className={`w-full bg-transparent text-base resize-none outline-none transition-all duration-300 placeholder:text-muted-foreground/60 ${
                mode === "dial"
                  ? "border border-border/60 rounded-xl px-4 py-3 min-h-[52px] text-sm"
                  : "border border-border rounded-xl px-4 py-3 min-h-[120px]"
              }`}
            />
          </div>
        </div>

        {/* ━━━ FLAVORS SECTION ━━━ (slides up in review mode) */}
        <div
          className="px-5 transition-all duration-400 ease-out"
          style={{
            maxHeight: mode === "review" ? "2000px" : "0px",
            opacity: mode === "review" ? 1 : 0,
            transform: mode === "review" ? "translateY(0)" : "translateY(24px)",
          }}
        >
          {/* Action chips */}
          <div className="flex gap-2 mt-4 mb-4">
            <button
              onClick={() => setShowFlavors(!showFlavors)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                showFlavors
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              Add flavors
              {showFlavors ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Selected flavor chips */}
          {selectedFlavors.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 animate-fade-in">
              {selectedFlavors.map((key) => {
                const meta = FLAVORS.find((f) => f.key === key);
                return (
                  <Badge
                    key={key}
                    className="bg-primary/15 text-primary border-primary/30 pl-3 pr-2 py-1.5 gap-1 cursor-pointer hover:bg-primary/25 transition-all duration-200 active:scale-95"
                    onClick={() => toggleFlavor(key)}
                  >
                    {meta?.label || key}
                    <X className="w-3.5 h-3.5" />
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Community flavors list */}
          {showFlavors && (
            <div className="animate-slide-up">
              <p className="text-sm text-muted-foreground mb-3">
                <span className="font-medium text-foreground">Most talked about</span>{" "}
                {Object.values(communityFlavors).reduce((a, b) => a + b, 0) > 0 && (
                  <>Based on community reviews</>
                )}
              </p>

              <div className="divide-y divide-border/50">
                {sortedCommunityFlavors.map(({ key, count, label, color }, index) => {
                  const isSelected = selectedFlavors.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleFlavor(key)}
                      className="w-full flex items-center gap-3 py-3.5 px-1 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0 transition-transform duration-200"
                        style={{
                          backgroundColor: color,
                          transform: isSelected ? "scale(1.3)" : "scale(1)",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`font-medium text-base transition-colors ${isSelected ? "text-primary" : ""}`}>
                          {label}
                        </span>
                        {count > 0 && (
                          <span className="text-muted-foreground ml-1.5">
                            ({typeof count === "number" && count % 1 !== 0 ? count.toFixed(2) : count}%)
                          </span>
                        )}
                      </div>
                      <div className="flex-shrink-0 transition-all duration-200">
                        {isSelected ? (
                          <Check className="w-5 h-5 text-primary" />
                        ) : (
                          <Plus className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spacer for bottom bar */}
          <div className="h-24" />
        </div>
      </div>

      {/* ── Bottom bar ── always in DOM to avoid layout shifts */}
      <div
        className="flex-shrink-0 transition-all duration-300 ease-out"
        style={{
          maxHeight: mode === "review" ? "120px" : mode === "dial" && !hasRating ? "60px" : "0px",
          opacity: mode === "review" || (mode === "dial" && !hasRating) ? 1 : 0,
          overflow: "hidden",
        }}
      >
        {mode === "review" ? (
          <div className="bg-background/90 backdrop-blur-lg border-t px-5 py-4">
            <Button
              onClick={onNext}
              disabled={selectedFlavors.length === 0}
              className={`w-full h-12 text-base font-semibold rounded-xl gap-2 transition-all duration-300 ${
                selectedFlavors.length > 0 ? "animate-scale-in" : ""
              }`}
              size="lg"
            >
              Next: Intensity
              <ArrowRight className="w-4 h-4" />
            </Button>
            {selectedFlavors.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Select at least one flavor to continue
              </p>
            )}
          </div>
        ) : mode === "dial" && !hasRating ? (
          <div className="pb-6 text-center px-6">
            <p className="text-muted-foreground text-sm">
              Drag the star around the dial to set your rating
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
