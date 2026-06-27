import { Card } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { AppText } from "../ui/app-text";

interface StatChipProps {
  value: string;
  label: string;
}

function StatChip({ value, label }: StatChipProps): JSX.Element {
  return (
    <Card className="flex-1 items-center">
      <AppText className="text-lg font-hero">{value}</AppText>
      <AppText className="text-sm text-muted mt-0.5">{label}</AppText>
    </Card>
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
