import type { JSX } from "react";

import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { LinearGradient } from "expo-linear-gradient";
import { ListGroup, PressableFeedback, ScrollShadow, Separator } from "heroui-native";
import { Pressable, ScrollView, View } from "react-native";
import useSWR from "swr";
import { withUniwind } from "uniwind";

import { api } from "@/api";
import { LoanListItem } from "@/components/activity/loan-list-item";
import { PendingRequestCard } from "@/components/activity/pending-request-card";
import { TransactionListItem } from "@/components/activity/transaction-list-item";
import { AppText } from "@/components/ui/app-text";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import { nav } from "@/lib/routes";
import { $activeGroup } from "@/stores/active-group";

const StyledIonicons = withUniwind(Ionicons);

function SectionLabel({ label, showBadge }: { label: string; showBadge?: boolean }): JSX.Element {
  return (
    <View className="flex-row items-center gap-2">
      <AppText className=" text-muted font-medium tracking-wider">{label}</AppText>
      {showBadge && <View className="size-1.5 rounded-full bg-accent" />}
    </View>
  );
}

export default function ActivityTab(): JSX.Element {
  const { activeGroupId } = useStore($activeGroup);
  const { data, isLoading } = useSWR(activeGroupId ? `activity:${activeGroupId}` : null, () =>
    Promise.all([
      api.groups.getPendingRequests(activeGroupId!),
      api.groups.getOutstandingLoans(activeGroupId!),
      api.groups.getRecentTransactions(activeGroupId!, 5),
    ]),
  );

  const pendingRequests = data?.[0] ?? [];
  const loans = data?.[1] ?? [];
  const transactions = data?.[2] ?? [];

  return (
    <ScreenContainer>
      <Header
        title="Activity"
        canGoBack={false}
        options={
          <Pressable onPress={() => nav.activity.toDiscretionaryRequest()} hitSlop={8}>
            <StyledIonicons name="add-outline" size={24} className="text-foreground" />
          </Pressable>
        }
      />
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <AppText className="text-muted text-base">Loading...</AppText>
        </View>
      ) : (
        <ScrollShadow LinearGradientComponent={LinearGradient}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="p-4 gap-8 pb-18"
          >
            {/* Section 1: Needs your action */}
            {pendingRequests.length > 0 && (
              <View className="gap-3">
                <SectionLabel label="Needs your action" showBadge />
                <ListGroup>
                  {pendingRequests.map((req, index) => (
                    <PendingRequestCard
                      key={req.id}
                      request={req}
                      showSeparator={index > 0}
                      onReview={() => {
                        switch (req.type) {
                          case "loan_request":
                            nav.activity.toLoanReview(req.id);
                            break;
                          case "settings_change":
                            nav.profile.toSettingsReview(req.id);
                            break;
                          case "join_request":
                            nav.activity.toJoinReview(req.id);
                            break;
                          case "discretionary_fund":
                            nav.activity.toDiscretionaryReview(req.id);
                            break;
                          case "member_withdrawal":
                            nav.activity.toWithdrawalReview(req.id);
                            break;
                        }
                      }}
                    />
                  ))}
                </ListGroup>
              </View>
            )}

            {/* Section 2: Outstanding loans */}
            {loans.length > 0 && (
              <View className="gap-3">
                <SectionLabel label="Outstanding loans" />
                <ListGroup>
                  {loans.map((loan, index) => (
                    <LoanListItem
                      key={loan.loanId}
                      loan={loan}
                      showSeparator={index > 0}
                      onPress={() => nav.activity.toLoanDetail(loan.loanId)}
                    />
                  ))}
                </ListGroup>
              </View>
            )}

            {/* Section 3: Recent transactions */}
            <View className="gap-3">
              <SectionLabel label="Recent transactions" />
              {transactions.length === 0 ? (
                <AppText className="text-sm text-muted text-center py-6">
                  No transactions yet.
                </AppText>
              ) : (
                <ListGroup>
                  {transactions.map((tx, index) => (
                    <TransactionListItem
                      key={tx.id}
                      transaction={tx}
                      showSeparator={index > 0}
                      onPress={() => nav.activity.toDetail(tx.id)}
                    />
                  ))}
                  <Separator className="mx-4" />
                  <PressableFeedback
                    animation={false}
                    onPress={() => nav.activity.toTransactions()}
                  >
                    <PressableFeedback.Scale>
                      <ListGroup.Item>
                        <ListGroup.ItemContent>
                          <ListGroup.ItemTitle className="text-accent">
                            View all
                          </ListGroup.ItemTitle>
                        </ListGroup.ItemContent>
                        <ListGroup.ItemSuffix />
                      </ListGroup.Item>
                    </PressableFeedback.Scale>
                    <PressableFeedback.Ripple />
                  </PressableFeedback>
                </ListGroup>
              )}
            </View>
          </ScrollView>
        </ScrollShadow>
      )}
    </ScreenContainer>
  );
}
