import { Surface } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { AppText } from "../ui/app-text";

interface StatChipProps {
  value: string;
  label: string;
}

function StatChip({ value, label }: StatChipProps): JSX.Element {
  return (
    <Surface variant="secondary" className="flex-1 items-center py-3 rounded-xl">
      <AppText className="text-lg font-semibold text-foreground">{value}</AppText>
      <AppText className="text-[11px] text-muted mt-0.5">{label}</AppText>
    </Surface>
  );
}

interface StatChipsRowProps {
  onTime: string;
  activeLoans: string;
  penalties: string;
}

export function StatChipsRow({ onTime, activeLoans, penalties }: StatChipsRowProps): JSX.Element {
  return (
    <View className="flex-row gap-3 w-full">
      <StatChip value={onTime} label="on time" />
      <StatChip value={activeLoans} label="active loan" />
      <StatChip value={penalties} label="penalty" />
    </View>
  );
}
