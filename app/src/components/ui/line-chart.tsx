import { Dimensions } from "react-native";
import Svg, { Path, Circle, Text as SvgText } from "react-native-svg";
import type { JSX } from "react";

interface LineChartProps {
  history: number[];
  projection: number[];
  width?: number;
  height?: number;
  color?: string;
  projectionColor?: string;
}

export function LineChart({
  history,
  projection,
  width = Dimensions.get("window").width - 32,
  height = 140,
  color = "#22c55e",
  projectionColor,
}: LineChartProps): JSX.Element {
  const allValues = [...history, ...projection];
  const maxVal = Math.max(...allValues, 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const padding = { top: 16, bottom: 28, left: 0, right: 0 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  function buildPath(data: number[]): string {
    return data
      .map((v, i) => {
        const x = padding.left + (i / (data.length - 1 || 1)) * chartW;
        const y = padding.top + chartH - ((v - minVal) / range) * chartH;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }

  const historyPath = buildPath(history);
  const projectionPath = buildPath(projection);

  const boundaryIdx = history.length - 1;
  const bX = padding.left + (boundaryIdx / (allValues.length - 1 || 1)) * chartW;
  const bY = padding.top + chartH - ((history[boundaryIdx] - minVal) / range) * chartH;

  const projEndIdx = allValues.length - 1;
  const peX = padding.left + (projEndIdx / (allValues.length - 1 || 1)) * chartW;
  const peY = padding.top + chartH - ((projection[projection.length - 1] - minVal) / range) * chartH;

  const pColor = projectionColor ?? color;

  return (
    <Svg width={width} height={height}>
      <Path
        d={historyPath}
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={projectionPath}
        stroke={pColor}
        strokeWidth={2.5}
        fill="none"
        strokeDasharray="6,4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={bX} cy={bY} r={4} fill={color} />
      <SvgText x={bX} y={height - 6} fontSize={10} fill="#9ca3af" textAnchor="middle">
        now
      </SvgText>
      <SvgText x={peX} y={peY - 10} fontSize={10} fill={pColor} textAnchor="end">
        cycle {projection.length}, projected
      </SvgText>
    </Svg>
  );
}
