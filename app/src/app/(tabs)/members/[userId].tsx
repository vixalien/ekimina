import type { JSX } from "react";

import type { MemberDetail as MemberDetailType } from "@/api";

import { useStore } from "@nanostores/react";
import { router, useLocalSearchParams } from "expo-router";
import { Avatar, Button, useToast } from "heroui-native";
import { startTransition, useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

import { api } from "@/api";
import { WithdrawMemberSheet } from "@/components/activity/withdraw-member-sheet";
import { ContributionHistory } from "@/components/members/contribution-history";
import { LoansSection } from "@/components/members/loans-section";
import { ReputationGauge } from "@/components/members/reputation-gauge";
import { StatChipsRow } from "@/components/members/stat-chips";
import { AppText } from "@/components/ui/app-text";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import { $activeGroup } from "@/stores/active-group";
import { $auth } from "@/stores/auth";

export default function MemberDetailScreen(): JSX.Element {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const activeGroup = useStore($activeGroup);
  const auth = useStore($auth);
  const [detail, setDetail] = useState<MemberDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllCycles, setShowAllCycles] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!activeGroup.activeGroupId || !userId) return;
    const requestingUserId = auth?.id ?? auth?.phone ?? "";
    startTransition(() => setLoading(true));
    api.groups
      .getMemberDetail(activeGroup.activeGroupId, userId, requestingUserId)
      .then(setDetail)
      .catch(() => {})
      .finally(() => startTransition(() => setLoading(false)));
  }, [activeGroup.activeGroupId, userId, auth]);

  const handleWithdraw = useCallback(
    async (reasonCategory: string) => {
      if (!activeGroup.activeGroupId || !userId || !auth?.id) return;
      setWithdrawing(true);
      try {
        await api.groups.initiateWithdrawal(
          activeGroup.activeGroupId,
          userId,
          auth.id,
          reasonCategory,
        );
        toast.show({
          variant: "success",
          label: "Withdrawal request submitted",
          description: "The committee will review it.",
        });
        setWithdrawOpen(false);
        router.back();
      } catch {
        toast.show({ variant: "danger", label: "Failed to submit withdrawal" });
      } finally {
        setWithdrawing(false);
      }
    },
    [activeGroup.activeGroupId, userId, auth, toast],
  );

  if (loading || !detail) {
    return (
      <ScreenContainer>
        <Header canGoBack />
        <View className="flex-1 items-center justify-center">
          <AppText className="text-muted text-base">Loading...</AppText>
        </View>
      </ScreenContainer>
    );
  }

  const roleLabel =
    detail.role === "admin" ? "Admin" : detail.role === "treasurer" ? "Treasurer" : "Member";

  return (
    <ScreenContainer>
      <Header canGoBack />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-36"
      >
        <View className="px-6 pt-4 pb-6 gap-6">
          <View className="flex-row items-center gap-3">
            <Avatar size="lg" color="accent">
              <Avatar.Fallback>{detail.initials}</Avatar.Fallback>
            </Avatar>
            <View className="gap-0.5">
              <AppText className="text-lg font-medium text-foreground">{detail.name}</AppText>
              <AppText className="text-sm text-muted">
                {roleLabel}, joined cycle {detail.joinedCycle}
              </AppText>
            </View>
          </View>

          <ReputationGauge score={detail.reputation} />

          <StatChipsRow
            onTime={`${detail.onTimeContributions} of ${detail.totalContributions}`}
            activeLoans={String(detail.activeLoanCount)}
            penalties={String(detail.penaltyCount)}
          />
        </View>

        <View className="px-6 gap-6">
          <ContributionHistory
            entries={detail.contributionHistory}
            showAll={showAllCycles}
            onToggleShowAll={() => setShowAllCycles(true)}
          />

          <LoansSection loans={detail.loans} />
        </View>

        {detail.isCommitteeMember && (
          <View className="px-6 pt-8">
            <Button variant="danger" onPress={() => setWithdrawOpen(true)}>
              <Button.Label>Withdraw member</Button.Label>
            </Button>
          </View>
        )}
      </ScrollView>

      <WithdrawMemberSheet
        isOpen={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        onConfirm={handleWithdraw}
        isLoading={withdrawing}
      />
    </ScreenContainer>
  );
}
