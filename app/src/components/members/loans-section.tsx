import { Ionicons } from "@expo/vector-icons";
import { ListGroup, PressableFeedback, Separator } from "heroui-native";
import { Fragment, type JSX } from "react";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import type { LoanEntry } from "../../api/types";
import { AppText } from "../ui/app-text";

const StyledIonicons = withUniwind(Ionicons);

interface LoansSectionProps {
  loans: LoanEntry[];
  onLoanPress?: (loan: LoanEntry) => void;
}

export function LoansSection({ loans, onLoanPress }: LoansSectionProps): JSX.Element {
  return (
    <View className="gap-3">
      <AppText className="text-xs text-muted uppercase tracking-wider ml-2">Loans</AppText>
      {loans.length === 0 ? (
        <AppText className="text-sm text-muted ml-2">No loans</AppText>
      ) : (
        <ListGroup>
          {loans.map((loan, index) => (
            <Fragment key={loan.id}>
              {index > 0 && <Separator className="mx-4" />}
              <PressableFeedback animation={false} onPress={() => onLoanPress?.(loan)}>
                <PressableFeedback.Scale>
                  <ListGroup.Item>
                    <ListGroup.ItemPrefix>
                      <View className="size-8 rounded-full bg-accent/10 items-center justify-center">
                        <StyledIonicons name="cash-outline" size={16} className="text-accent" />
                      </View>
                    </ListGroup.ItemPrefix>
                    <ListGroup.ItemContent>
                      <ListGroup.ItemTitle>{loan.amount.toLocaleString()}</ListGroup.ItemTitle>
                      <ListGroup.ItemDescription>{loan.state}</ListGroup.ItemDescription>
                    </ListGroup.ItemContent>
                    <ListGroup.ItemSuffix />
                  </ListGroup.Item>
                </PressableFeedback.Scale>
                <PressableFeedback.Ripple />
              </PressableFeedback>
            </Fragment>
          ))}
        </ListGroup>
      )}
    </View>
  );
}
