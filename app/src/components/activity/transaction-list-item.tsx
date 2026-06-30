import { Ionicons } from "@expo/vector-icons";
import { cn, ListGroup, PressableFeedback, Separator } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import { withUniwind } from "uniwind";
import type { Transaction, TransactionDirection } from "../../api/types";
import {
  STATUS_ICON_BG,
  STATUS_ICON_COLOR,
  TRANSACTION_ICONS,
  TRANSACTION_TYPE_LABELS,
} from "../../lib/activity-constants";
import { formatRWF } from "../../lib/strings";
import { AppText } from "../ui/app-text";

const StyledIonicons = withUniwind(Ionicons);

const DIRECTION_COLOR: Record<TransactionDirection, string> = {
  inflow: "text-success",
  outflow: "text-danger",
  neutral: "text-muted",
};

const DIRECTION_PREFIX: Record<TransactionDirection, string> = {
  inflow: "+",
  outflow: "-",
  neutral: "",
};

interface TransactionListItemProps {
  transaction: Transaction;
  onPress: () => void;
  showSeparator?: boolean;
}

export function TransactionListItem({
  transaction,
  onPress,
  showSeparator,
}: TransactionListItemProps): JSX.Element {
  const typeLabel = TRANSACTION_TYPE_LABELS[transaction.type];
  const amountColor = DIRECTION_COLOR[transaction.direction];
  const prefix = DIRECTION_PREFIX[transaction.direction];

  return (
    <>
      {showSeparator && <Separator className="mx-4" />}
      <PressableFeedback animation={false} onPress={onPress}>
        <PressableFeedback.Scale>
          <ListGroup.Item>
            <ListGroup.ItemPrefix>
              <View
                className={cn(
                  "size-9 rounded-full items-center justify-center",
                  STATUS_ICON_BG[transaction.status]
                )}
              >
                <StyledIonicons
                  name={TRANSACTION_ICONS[transaction.type]}
                  size={18}
                  className={STATUS_ICON_COLOR[transaction.status]}
                />
              </View>
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {typeLabel}, {transaction.memberName}
              </ListGroup.ItemTitle>
              <ListGroup.ItemDescription className="text-muted">
                Cycle {transaction.cycle}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <AppText className={cn("text-sm font-medium", amountColor)}>
                {prefix}
                {formatRWF(transaction.amount)}
              </AppText>
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </PressableFeedback.Scale>
        <PressableFeedback.Ripple />
      </PressableFeedback>
    </>
  );
}
