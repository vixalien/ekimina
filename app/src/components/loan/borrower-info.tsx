import { Avatar, ListGroup, PressableFeedback } from "heroui-native";
import type { JSX } from "react";
import { router } from "expo-router";

interface BorrowerInfoProps {
  borrowerUserId: string;
  borrowerName: string;
  borrowerInitials: string;
  borrowerRole: string;
  borrowerJoinedCycle: number;
}

export function BorrowerInfo({
  borrowerUserId,
  borrowerName,
  borrowerInitials,
  borrowerRole,
  borrowerJoinedCycle,
}: BorrowerInfoProps): JSX.Element {
  return (
    <ListGroup>
      <PressableFeedback
        animation={false}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/members/[userId]",
            params: { userId: borrowerUserId },
          })
        }
      >
        <PressableFeedback.Scale>
          <ListGroup.Item>
            <ListGroup.ItemPrefix>
              <Avatar size="sm" color="accent">
                <Avatar.Fallback>{borrowerInitials}</Avatar.Fallback>
              </Avatar>
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{borrowerName}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription className="text-muted">
                {borrowerRole} · Joined cycle {borrowerJoinedCycle}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </PressableFeedback.Scale>
        <PressableFeedback.Ripple />
      </PressableFeedback>
    </ListGroup>
  );
}
