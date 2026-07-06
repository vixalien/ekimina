import type { JSX } from "react";

import { ListGroup, Separator } from "heroui-native";

import { formatRWF } from "../../lib/strings";
import { AppText } from "../ui/app-text";

interface LoanTermsCardProps {
  amount: number;
  interestRate: number;
  totalOwed?: number;
  deadline: string;
  purpose: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-RW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function LoanTermsCard({
  amount,
  interestRate,
  totalOwed,
  deadline,
  purpose,
}: LoanTermsCardProps): JSX.Element {
  return (
    <ListGroup>
      <ListGroup.Item disabled>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle className="text-muted font-normal text-sm">
            Amount requested
          </ListGroup.ItemTitle>
        </ListGroup.ItemContent>
        <ListGroup.ItemSuffix>
          <AppText className="text-sm font-medium text-foreground">{formatRWF(amount)}</AppText>
        </ListGroup.ItemSuffix>
      </ListGroup.Item>
      <Separator className="mx-4" />
      <ListGroup.Item disabled>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle className="text-muted font-normal text-sm">
            Interest
          </ListGroup.ItemTitle>
        </ListGroup.ItemContent>
        <ListGroup.ItemSuffix>
          <AppText className="text-sm font-medium text-foreground">{interestRate}% flat</AppText>
        </ListGroup.ItemSuffix>
      </ListGroup.Item>
      {totalOwed !== undefined && (
        <>
          <Separator className="mx-4" />
          <ListGroup.Item disabled>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className="text-muted font-normal text-sm">
                Total to repay
              </ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <AppText className="text-sm font-medium text-foreground">
                {formatRWF(totalOwed)}
              </AppText>
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </>
      )}
      <Separator className="mx-4" />
      <ListGroup.Item disabled>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle className="text-muted font-normal text-sm">
            Deadline
          </ListGroup.ItemTitle>
        </ListGroup.ItemContent>
        <ListGroup.ItemSuffix>
          <AppText className="text-sm font-medium text-foreground">{formatDate(deadline)}</AppText>
        </ListGroup.ItemSuffix>
      </ListGroup.Item>
      <Separator className="mx-4" />
      <ListGroup.Item disabled>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle className="text-muted font-normal text-sm">
            Purpose
          </ListGroup.ItemTitle>
        </ListGroup.ItemContent>
        <ListGroup.ItemSuffix>
          <AppText
            className="text-sm font-medium text-foreground text-right max-w-[200px]"
            numberOfLines={3}
          >
            {purpose}
          </AppText>
        </ListGroup.ItemSuffix>
      </ListGroup.Item>
    </ListGroup>
  );
}
