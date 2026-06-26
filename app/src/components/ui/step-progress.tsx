import type { JSX } from "react";
import { View } from "react-native";

interface StepProgressProps {
  totalSteps: number;
  currentStep: number;
}

export function StepProgress({ totalSteps, currentStep }: StepProgressProps): JSX.Element {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step <= currentStep;
        return (
          <View
            key={step}
            className={`size-2 rounded-full ${isActive ? "bg-accent" : "bg-border"}`}
          />
        );
      })}
    </View>
  );
}
