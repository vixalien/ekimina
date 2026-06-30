import { ListGroup, PressableFeedback, Separator } from "heroui-native";
import type { JSX } from "react";
import { AppText } from "../ui/app-text";
import { formatRWF } from "../../lib/strings";

interface RepaymentInfoProps {
  amountPaid: number;
  totalOwed: number;
  lastPaymentAt?: string;
  onAmountPaidPress?: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-RW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function RepaymentInfo({
  amountPaid,
  totalOwed,
  lastPaymentAt,
  onAmountPaidPress,
}: RepaymentInfoProps): JSX.Element {
  const percentage = totalOwed > 0 ? Math.round((amountPaid / totalOwed) * 100) : 0;

  return (
    <ListGroup>
      {onAmountPaidPress ? (
        <PressableFeedback animation={false} onPress={onAmountPaidPress}>
          <PressableFeedback.Scale>
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle className="text-muted font-normal text-sm">
                  Amount paid
                </ListGroup.ItemTitle>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <AppText className="text-sm font-medium text-accent">
                  {formatRWF(amountPaid)}
                </AppText>
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </PressableFeedback.Scale>
          <PressableFeedback.Ripple />
        </PressableFeedback>
      ) : (
        <ListGroup.Item disabled>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle className="text-muted font-normal text-sm">
              Amount paid
            </ListGroup.ItemTitle>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix>
            <AppText className="text-sm font-medium text-foreground">
              {formatRWF(amountPaid)}
            </AppText>
          </ListGroup.ItemSuffix>
        </ListGroup.Item>
      )}
      <Separator className="mx-4" />
      <ListGroup.Item disabled>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle className="text-muted font-normal text-sm">
            Total amount
          </ListGroup.ItemTitle>
        </ListGroup.ItemContent>
        <ListGroup.ItemSuffix>
          <AppText className="text-sm font-medium text-foreground">{formatRWF(totalOwed)}</AppText>
        </ListGroup.ItemSuffix>
      </ListGroup.Item>
      <Separator className="mx-4" />
      <ListGroup.Item disabled>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle className="text-muted font-normal text-sm">
            Percentage paid
          </ListGroup.ItemTitle>
        </ListGroup.ItemContent>
        <ListGroup.ItemSuffix>
          <AppText className="text-sm font-medium text-foreground">{percentage}%</AppText>
        </ListGroup.ItemSuffix>
      </ListGroup.Item>
      {lastPaymentAt && (
        <>
          <Separator className="mx-4" />
          <ListGroup.Item disabled>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className="text-muted font-normal text-sm">
                Last payment
              </ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <AppText className="text-sm font-medium text-foreground">
                {formatDate(lastPaymentAt)}
              </AppText>
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </>
      )}
    </ListGroup>
  );
}
