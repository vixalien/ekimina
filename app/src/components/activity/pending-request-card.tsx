import { Chip, ListGroup, PressableFeedback, Separator } from "heroui-native";
import type { JSX } from "react";
import type { ActivityPendingRequest, PendingRequestType } from "@/api";
import { View } from "react-native";

const REQUEST_TYPE_LABELS: Record<PendingRequestType, string> = {
  loan_request: "Loan request",
  discretionary_fund: "Discretionary fund",
  join_request: "Join request",
  member_withdrawal: "Withdraw member",
  settings_change: "Settings change",
};

interface PendingRequestCardProps {
  request: ActivityPendingRequest;
  onReview: () => void;
  showSeparator?: boolean;
}

export function PendingRequestCard({
  request,
  onReview,
  showSeparator,
}: PendingRequestCardProps): JSX.Element {
  const typeLabel = REQUEST_TYPE_LABELS[request.type];
  const sigLine = `${request.signatureCount} / ${request.signatureThreshold}`;

  return (
    <>
      {showSeparator && <Separator className="mx-4" />}
      <PressableFeedback animation={false} onPress={onReview}>
        <PressableFeedback.Scale>
          <ListGroup.Item>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {typeLabel}, {request.subject}
              </ListGroup.ItemTitle>
              {request.amountOrValue && (
                <ListGroup.ItemDescription className="text-muted">
                  {request.amountOrValue}
                </ListGroup.ItemDescription>
              )}
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <View className="flex-col">
                <Chip variant="soft" size="sm" className="tabular-nums">
                  <Chip.Label>{sigLine}</Chip.Label>
                </Chip>
              </View>
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </PressableFeedback.Scale>
        <PressableFeedback.Ripple />
      </PressableFeedback>
    </>
  );
}
