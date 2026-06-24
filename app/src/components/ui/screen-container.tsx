import type { JSX, ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenContainerProps {
  children: ReactNode;
  className?: string;
  /** Add extra top padding beyond safe area (e.g. for back button space) */
  extraTop?: number;
}

export function ScreenContainer({
  children,
  className = "",
  extraTop = 0,
}: ScreenContainerProps): JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`flex-1 bg-background ${className}`}
      style={{
        paddingTop: insets.top + extraTop,
        paddingBottom: insets.bottom + 12,
      }}
    >
      {children}
    </View>
  );
}
