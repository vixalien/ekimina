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
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        return (
          <View
            key={step}
            className={`rounded-full ${
              isCompleted
                ? "size-2 bg-accent"
                : isCurrent
                  ? "size-3 bg-accent"
                  : "size-2 border border-border"
            }`}
          />
        );
      })}
    </View>
  );
}
