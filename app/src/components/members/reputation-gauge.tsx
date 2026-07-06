import type { JSX } from "react";

import { useThemeColor } from "heroui-native";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { AppText } from "../ui/app-text";

interface ReputationGaugeProps {
  score: number;
  size?: number;
}

export function ReputationGauge({ score, size = 92 }: ReputationGaugeProps): JSX.Element {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filledLength = (score / 100) * circumference;
  const borderColor = useThemeColor("border");
  const successColor = useThemeColor("success");
  const warningColor = useThemeColor("warning");
  const dangerColor = useThemeColor("danger");

  const gaugeColor = score > 70 ? successColor : score >= 40 ? warningColor : dangerColor;

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
          stroke={gaugeColor}
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
        <AppText className="text-2xl font-hero text-foreground">{score}</AppText>
        <AppText className="text-[10px] text-muted -mt-1">reputation</AppText>
      </View>
    </View>
  );
}
