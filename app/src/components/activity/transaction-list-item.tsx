import { Ionicons } from "@expo/vector-icons";
import { cn, ListGroup, PressableFeedback, Separator } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import { withUniwind } from "uniwind";
import type {
  Transaction,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
} from "../../api/types";
import { formatRWF } from "../../lib/strings";
import { AppText } from "../ui/app-text";

const StyledIonicons = withUniwind(Ionicons);

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const TRANSACTION_ICONS: Record<TransactionType, IoniconName> = {
  contribution: "arrow-down-circle-outline",
  payout: "arrow-up-circle-outline",
  penalty: "warning-outline",
  loan_repayment: "return-up-forward-outline",
  loan_disbursement: "cash-outline",
  discretionary_deposit: "wallet-outline",
  discretionary_withdrawal: "receipt-outline",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  contribution: "Contribution",
  payout: "Payout",
  penalty: "Penalty",
  loan_repayment: "Loan repayment",
  loan_disbursement: "Loan disbursement",
  discretionary_deposit: "Disc. deposit",
  discretionary_withdrawal: "Disc. withdrawal",
};

const STATUS_BG: Record<TransactionStatus, string> = {
  confirmed: "bg-accent/10",
  pending: "bg-warning/10",
  failed: "bg-danger/10",
};

const STATUS_ICON_COLOR: Record<TransactionStatus, string> = {
  confirmed: "text-accent",
  pending: "text-warning",
  failed: "text-danger",
};

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
                  STATUS_BG[transaction.status]
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
