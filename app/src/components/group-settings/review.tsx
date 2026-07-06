import type { JSX } from "react";

import type { GroupSettings } from "@/api";

import { ListGroup, PressableFeedback, Separator } from "heroui-native";
import { View } from "react-native";

import { AppText } from "../ui/app-text";

export type ReviewSection = "basics" | "money" | "rules" | "loans";

interface ReviewItem {
  section: ReviewSection;
  label: string;
  value: string;
}

function formatThreshold(v: number): string {
  if (v === 0.5) return "1 of 2";
  if (v >= 1) return "All";
  return "2 of 3";
}

function buildItems(s: GroupSettings): ReviewItem[] {
  return [
    { section: "basics", label: "Group name", value: s.name },
    {
      section: "basics",
      label: "Policy",
      value: s.isPublic ? "Public" : "Private",
    },
    {
      section: "money",
      label: "Contribution",
      value: `${s.contributionAmount.toLocaleString()} RWF`,
    },
    { section: "money", label: "Cycle length", value: `${s.cycleLength} days` },
    {
      section: "money",
      label: "Payout",
      value: `${s.payoutAmount.toLocaleString()} RWF`,
    },
    { section: "rules", label: "Penalty rate", value: `${s.penaltyRate}%` },
    {
      section: "rules",
      label: "Approval threshold",
      value: formatThreshold(s.approvalThreshold),
    },
    {
      section: "rules",
      label: "Committee",
      value: s.allMembersAreCommittee ? "All members" : `${s.committeeSize} members`,
    },
    {
      section: "loans",
      label: "Loans",
      value: s.loansEnabled ? "Enabled" : "Disabled",
    },
    ...(s.loansEnabled
      ? [
          {
            section: "loans" as const,
            label: "Loan interest",
            value: `${s.loanInterestRate}% flat`,
          },
        ]
      : []),
    {
      section: "loans",
      label: "Discretionary fund",
      value: s.discretionaryFundEnabled ? "Enabled" : "Disabled",
    },
  ];
}

interface SettingsReviewListProps {
  settings: GroupSettings;
  onItemPress: (section: ReviewSection) => void;
}

export function SettingsReviewList({
  settings,
  onItemPress,
}: SettingsReviewListProps): JSX.Element {
  const items = buildItems(settings);

  return (
    <ListGroup>
      {items.map((item, index) => (
        <View key={`${item.section}-${item.label}`}>
          {index > 0 && <Separator className="mx-4" />}
          <PressableFeedback animation={false} onPress={() => onItemPress(item.section)}>
            <PressableFeedback.Scale>
              <ListGroup.Item disabled>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{item.label}</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                <View className="mr-1">
                  <AppText className="text-sm text-muted">{item.value}</AppText>
                </View>
                <ListGroup.ItemSuffix />
              </ListGroup.Item>
            </PressableFeedback.Scale>
            <PressableFeedback.Ripple />
          </PressableFeedback>
        </View>
      ))}
    </ListGroup>
  );
}
