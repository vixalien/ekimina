import { cn } from "heroui-native";
import React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";

export const AppText = React.forwardRef<RNText, RNTextProps>(
  (props, ref) => {
    const { className, ...rest } = props;
    return (
      <RNText ref={ref} className={cn("font-normal", className)} {...rest} />
    );
  },
);

AppText.displayName = "AppText";
