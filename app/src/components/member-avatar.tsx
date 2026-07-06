import type { JSX } from "react";

import type { MemberStanding } from "@/api";

import { Avatar } from "heroui-native";
import { View } from "react-native";

interface MemberAvatarProps {
  initials: string;
  status: MemberStanding["status"];
}

export function MemberAvatar({ initials, status }: MemberAvatarProps): JSX.Element {
  const ringColor =
    status === "paid"
      ? "border-success"
      : status === "pending_late"
        ? "border-warning"
        : status === "missed_penalised"
          ? "border-danger"
          : "border-transparent";

  return (
    <View className={`rounded-full border-2 ${ringColor}`}>
      <Avatar size="sm" color="default">
        <Avatar.Fallback>{initials}</Avatar.Fallback>
      </Avatar>
    </View>
  );
}
