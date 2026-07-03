import { Avatar, ListGroup, PressableFeedback, Separator } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import type { OutstandingLoan } from "@/api";
import { formatRWF } from "../../lib/strings";
import { AppText } from "../ui/app-text";

interface LoanListItemProps {
  loan: OutstandingLoan;
  onPress: () => void;
  showSeparator?: boolean;
}

export function LoanListItem({ loan, onPress, showSeparator }: LoanListItemProps): JSX.Element {
  return (
    <>
      {showSeparator && <Separator className="mx-4" />}
      <PressableFeedback animation={false} onPress={onPress}>
        <PressableFeedback.Scale>
          <ListGroup.Item>
            <ListGroup.ItemPrefix>
              <Avatar size="sm" color="accent">
                <Avatar.Fallback>{loan.borrowerInitials}</Avatar.Fallback>
              </Avatar>
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{loan.borrowerName}</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <View className="items-end gap-0.5">
                <AppText className="text-sm font-medium text-foreground">
                  {formatRWF(loan.amount)}
                </AppText>
                <AppText className="text-xs text-muted">due cycle {loan.dueCycle}</AppText>
              </View>
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </PressableFeedback.Scale>
        <PressableFeedback.Ripple />
      </PressableFeedback>
    </>
  );
}
