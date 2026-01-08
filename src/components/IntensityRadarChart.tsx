import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface IntensityRadarChartProps {
  userRatings: Record<string, number>;
  communityRatings: Record<string, number>;
}

const AXES = [
  { key: "fruit", label: "Fruit" },
  { key: "floral", label: "Floral" },
  { key: "oak", label: "Oak" },
  { key: "smoke", label: "Smoke" },
  { key: "spice", label: "Spice" },
];

export const IntensityRadarChart = ({
  userRatings,
  communityRatings,
}: IntensityRadarChartProps) => {
  const data = AXES.map((axis) => ({
    axis: axis.label,
    user: userRatings[axis.key] ?? 2,
    community: communityRatings[axis.key] ?? 2,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="hsl(var(--muted-foreground)/0.2)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 4]}
          tickCount={5}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          axisLine={false}
        />
        <Radar
          name="You"
          dataKey="user"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.4}
          strokeWidth={2}
        />
        <Radar
          name="Community"
          dataKey="community"
          stroke="hsl(var(--muted-foreground))"
          fill="hsl(var(--muted-foreground))"
          fillOpacity={0.2}
          strokeWidth={2}
          strokeDasharray="4 4"
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};
