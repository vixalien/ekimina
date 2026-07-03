import { Fragment, type JSX } from "react";
import { ListGroup, PressableFeedback, Separator } from "heroui-native";
import { Pressable, View } from "react-native";

import type { ContributionHistoryEntry } from "@/api";
import { AppText } from "../ui/app-text";

interface ContributionHistoryProps {
  entries: ContributionHistoryEntry[];
  showAll: boolean;
  onToggleShowAll: () => void;
}

export function ContributionHistory({
  entries,
  showAll,
  onToggleShowAll,
}: ContributionHistoryProps): JSX.Element {
  const displayEntries = showAll ? entries : entries.slice(0, 3);

  return (
    <View className="gap-3">
      <AppText className="text-xs text-muted uppercase tracking-wider ml-2">
        Contribution history
      </AppText>
      <ListGroup>
        {displayEntries.map((entry, index) => {
          const outcomeColor =
            entry.status === "paid_on_time"
              ? "text-success"
              : entry.status === "paid_late"
                ? "text-warning"
                : "text-danger";
          const outcomeText =
            entry.status === "paid_on_time"
              ? "paid on time"
              : entry.status === "paid_late"
                ? `paid late, -${entry.penaltyAmount?.toLocaleString() ?? 0}`
                : "missed";

          return (
            <Fragment key={entry.cycle}>
              {index > 0 && <Separator className="mx-4" />}
              <PressableFeedback animation="disable-all">
                <ListGroup.Item>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Cycle {entry.cycle}</ListGroup.ItemTitle>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix>
                    <AppText className={`text-sm ${outcomeColor}`}>{outcomeText}</AppText>
                  </ListGroup.ItemSuffix>
                </ListGroup.Item>
              </PressableFeedback>
            </Fragment>
          );
        })}
      </ListGroup>

      {entries.length > 3 && !showAll && (
        <Pressable onPress={onToggleShowAll} className="py-1">
          <AppText className="text-sm text-accent font-medium">View all</AppText>
        </Pressable>
      )}
    </View>
  );
}
