import type { JSX } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/ui/screen-container";
import { Header } from "@/components/ui/header";
import { AppText } from "@/components/ui/app-text";
import type { PendingRequestType } from "@/api/types";

const REVIEW_TITLES: Record<PendingRequestType, string> = {
  loan_request: "Loan Request",
  discretionary_fund: "Discretionary Fund",
  join_request: "Join Request",
  member_withdrawal: "Member Withdrawal",
  settings_change: "Settings Change",
};

export default function ReviewScreen(): JSX.Element {
  const { requestId, requestType } = useLocalSearchParams<{
    requestId: string;
    requestType: PendingRequestType;
  }>();

  const title = requestType ? (REVIEW_TITLES[requestType] ?? "Review") : "Review";

  return (
    <ScreenContainer>
      <Header title={`Review: ${title}`} canGoBack />
      <View className="flex-1 items-center justify-center px-6 gap-3">
        <AppText className="text-base text-foreground font-semibold text-center">
          {title} Review
        </AppText>
        <AppText className="text-sm text-muted text-center">Request ID: {requestId}</AppText>
        <AppText className="text-sm text-muted text-center">
          This review screen is coming in a future phase.
        </AppText>
      </View>
    </ScreenContainer>
  );
}
