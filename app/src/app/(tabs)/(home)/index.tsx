import { Ionicons } from "@expo/vector-icons";
import { Avatar, Card, Chip, PressableFeedback, Surface } from "heroui-native";
import { useStore } from "@nanostores/react";
import { router } from "expo-router";
import type { JSX } from "react";
import { startTransition, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { withUniwind } from "uniwind";

import { api } from "../../../api";
import type { GroupDashboardData, GroupMembership } from "../../../api/types";
import { DonutChart } from "../../../components/ui/donut-chart";
import { MemberAvatar } from "../../../components/member-avatar";
import { Sparkline } from "../../../components/ui/sparkline";
import { TopBar } from "../../../components/top-bar";
import { AppText } from "../../../components/ui/app-text";
import { GroupSwitcher } from "../../../components/group-switcher";
import {
  $activeGroup,
  $openSwitcher,
  clearOpenSwitcher,
  dismissSwitcherOnMount,
  switchGroup,
  triggerSwitcher,
} from "../../../stores/active-group";
import { $auth } from "../../../stores/auth";
import { formatRWF, initialsOf } from "../../../lib/strings";

const StyledIonicons = withUniwind(Ionicons);

export default function HomeTab(): JSX.Element {
  const auth = useStore($auth);
  const activeGroup = useStore($activeGroup);
  const openSwitcherFlag = useStore($openSwitcher);
  const [dashboard, setDashboard] = useState<GroupDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const activeMembership = activeGroup.memberships.find(
    (m) => m.group.id === activeGroup.activeGroupId
  );
  const groupName = activeMembership?.group.name ?? "";
  const userInitials = auth?.name ? initialsOf(auth.name) : (auth?.phone?.slice(-4) ?? "?");

  useEffect(() => {
    if (!activeGroup.activeGroupId) return;
    startTransition(() => setLoading(true));
    api.groups
      .getGroupDashboard(activeGroup.activeGroupId)
      .then(setDashboard)
      .catch(() => {})
      .finally(() => startTransition(() => setLoading(false)));
  }, [activeGroup.activeGroupId]);

  useEffect(() => {
    if (activeGroup.showSwitcherOnMount) {
      dismissSwitcherOnMount();
      startTransition(() => setIsSwitcherOpen(true));
    }
  }, [activeGroup.showSwitcherOnMount]);

  useEffect(() => {
    if (openSwitcherFlag) {
      startTransition(() => {
        setIsSwitcherOpen(true);
        clearOpenSwitcher();
      });
    }
  }, [openSwitcherFlag]);

  function handleSelectGroup(membership: GroupMembership) {
    switchGroup(membership.group.id);
    setIsSwitcherOpen(false);
  }

  function handleJoinOrCreate() {
    setIsSwitcherOpen(false);
    router.push("/(onboarding)/join-or-create");
  }

  if (loading || !dashboard) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <AppText className="text-muted text-base">Loading...</AppText>
      </View>
    );
  }

  const paidPercent = Math.round(
    (dashboard.paidCount / Math.max(dashboard.totalMemberCount, 1)) * 100
  );

  const payoutText =
    dashboard.daysUntilPayout > 0
      ? `Due in ${dashboard.daysUntilPayout} day${dashboard.daysUntilPayout === 1 ? "" : "s"}`
      : dashboard.daysUntilPayout === 0
        ? "Due today"
        : `Overdue by ${Math.abs(dashboard.daysUntilPayout)} day${Math.abs(dashboard.daysUntilPayout) === 1 ? "" : "s"}`;

  const isOverdue = dashboard.daysUntilPayout < 0;

  return (
    <>
      <TopBar groupName={groupName} userInitials={userInitials} onPress={triggerSwitcher} />
      <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-6 pb-8 gap-6">
          <View className="flex-row items-center justify-between">
            <AppText className="text-sm text-muted">This cycle</AppText>
            <Chip size="sm" color="accent">
              <Chip.Label className="text-xs">
                Cycle {dashboard.currentCycle} of {dashboard.totalCycles}
              </Chip.Label>
            </Chip>
          </View>

          <View className="items-center py-4">
            <DonutChart percentage={paidPercent} size={120} strokeWidth={8} />
            <AppText className="text-sm text-muted mt-2">
              {paidPercent >= 100
                ? "Everyone has paid"
                : `${dashboard.paidCount} of ${dashboard.totalMemberCount} paid`}
            </AppText>
          </View>

          <PressableFeedback>
            <Card variant="secondary">
              <Card.Body>
                <View className="flex-row items-center justify-between mb-1">
                  <AppText className="text-sm text-muted">Group reserve</AppText>
                  <StyledIonicons name="chevron-forward" size={18} className="text-muted" />
                </View>
                <AppText className="text-3xl font-hero text-foreground mb-2">
                  {formatRWF(dashboard.reserveBalance)}
                </AppText>
                <Sparkline
                  data={dashboard.reserveHistory}
                  color="#22c55e"
                  width={280}
                  height={32}
                />
              </Card.Body>
            </Card>
          </PressableFeedback>

          <View className="flex-row gap-3">
            <Surface variant="secondary" className="flex-1 p-4 items-center rounded-2xl">
              <AppText className="text-xs text-muted mb-1">Contribution</AppText>
              <AppText className="text-xl font-semibold text-foreground">
                {dashboard.contributionAmount.toLocaleString()}
              </AppText>
            </Surface>
            <Surface variant="secondary" className="flex-1 p-4 items-center rounded-2xl">
              <AppText className="text-xs text-muted mb-1">Payout size</AppText>
              <AppText className="text-xl font-semibold text-foreground">
                {dashboard.payoutAmount.toLocaleString()}
              </AppText>
            </Surface>
          </View>

          <Card variant="transparent" className="border border-border rounded-2xl">
            <Card.Body className="flex-row items-center gap-3">
              <Avatar size="md" color="accent">
                <Avatar.Fallback>{dashboard.nextPayoutRecipient.initials}</Avatar.Fallback>
              </Avatar>
              <View className="flex-1 gap-0.5">
                <AppText
                  className={`text-sm font-medium ${isOverdue ? "text-warning" : "text-foreground"}`}
                >
                  {payoutText}
                </AppText>
                <AppText className="text-xs text-muted">
                  {dashboard.nextPayoutRecipient.name} receives {formatRWF(dashboard.payoutAmount)}
                </AppText>
              </View>
            </Card.Body>
          </Card>

          <View className="gap-3">
            <AppText className="text-xs text-muted uppercase tracking-wider">
              Member standing
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row items-center gap-2">
                {dashboard.members.slice(0, 15).map((m) => (
                  <MemberAvatar key={m.userId} initials={m.initials} status={m.status} />
                ))}
                {dashboard.members.length > 15 && (
                  <View className="size-9 items-center justify-center">
                    <AppText className="text-xs text-muted">
                      +{dashboard.members.length - 15}
                    </AppText>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <GroupSwitcher
        isOpen={isSwitcherOpen}
        onOpenChange={setIsSwitcherOpen}
        memberships={activeGroup.memberships}
        activeGroupId={activeGroup.activeGroupId ?? undefined}
        onSelectGroup={handleSelectGroup}
        onJoinOrCreate={handleJoinOrCreate}
      />
    </>
  );
}
