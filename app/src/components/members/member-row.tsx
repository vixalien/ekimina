import { Avatar, ListGroup, PressableFeedback, Separator } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import type { MemberListItem } from "../../api/types";
import { AppText } from "../ui/app-text";

interface MemberRowProps {
  member: MemberListItem;
  onPress: () => void;
  showSeparator?: boolean;
}

function statusLine(member: MemberListItem): { text: string; color: string } {
  if (member.activeLoanAmount && member.status === "paid") {
    return {
      text: `paid, loan ${member.activeLoanAmount.toLocaleString()}`,
      color: "text-info",
    };
  }
  switch (member.status) {
    case "paid":
      return { text: "paid this cycle", color: "text-success" };
    case "pending_late":
      return { text: "pending", color: "text-warning" };
    case "missed_penalised":
      return { text: "penalty applied", color: "text-danger" };
    default:
      return { text: "no status", color: "text-warning" };
  }
}

export function MemberRow({ member, onPress, showSeparator }: MemberRowProps): JSX.Element {
  const line = statusLine(member);

  const row = (
    <PressableFeedback animation={false} onPress={onPress}>
      <PressableFeedback.Scale>
        <ListGroup.Item>
          <ListGroup.ItemPrefix>
            <Avatar size="sm" color="accent">
              <Avatar.Fallback>{member.initials}</Avatar.Fallback>
            </Avatar>
          </ListGroup.ItemPrefix>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle>{member.name}</ListGroup.ItemTitle>
            <ListGroup.ItemDescription className={line.color}>
              {line.text}
            </ListGroup.ItemDescription>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix>
            <View className="flex-row items-center gap-2">
              <AppText className="text-xs text-muted">rep {member.reputation}</AppText>
            </View>
          </ListGroup.ItemSuffix>
        </ListGroup.Item>
      </PressableFeedback.Scale>
      <PressableFeedback.Ripple />
    </PressableFeedback>
  );

  return (
    <>
      {row}
      {showSeparator && <Separator className="mx-4" />}
    </>
  );
}
