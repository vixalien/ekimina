import type { JSX } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { AppText } from "./app-text";
import { useThemeColor } from "heroui-native";

interface DonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({
  percentage,
  size = 120,
  strokeWidth = 8,
}: DonutChartProps): JSX.Element {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filledLength = (percentage / 100) * circumference;
  const borderColor = useThemeColor("border");
  const accentColor = useThemeColor("success");

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={borderColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={accentColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${filledLength} ${circumference - filledLength}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View className="absolute items-center justify-center">
        <AppText className="text-2xl font-semibold text-foreground">
          {percentage >= 100 ? "All paid" : `${Math.round(percentage)}%`}
        </AppText>
      </View>
    </View>
  );
}
