import type { JSX } from "react";
import Svg, { Polyline } from "react-native-svg";

interface SparklineProps {
  data: number[];
  color: string;
  height?: number;
  width?: number;
  strokeWidth?: number;
}

export function Sparkline({
  data,
  color,
  height = 32,
  width = 160,
  strokeWidth = 2,
}: SparklineProps): JSX.Element {
  if (data.length < 2) return <Svg width={width} height={height} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 2;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * plotWidth;
      const y = padding + plotHeight - ((val - min) / range) * plotHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
