import type { JSX } from "react";

import type { GroupSettingField, GroupSettings } from "@/api";

import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Avatar,
  ListGroup,
  PressableFeedback,
  ScrollShadow,
  Separator,
  useToast,
} from "heroui-native";
import { Fragment, useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import useSWR from "swr";
import { withUniwind } from "uniwind";

import { api } from "@/api";
import { SettingsModal } from "@/components/settings/settings-modal";
import { AppText } from "@/components/ui/app-text";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import { $activeGroup } from "@/stores/active-group";
import { $auth } from "@/stores/auth";

const StyledIonicons = withUniwind(Ionicons);

interface SettingsRow {
  field: GroupSettingField;
  label: string;
  value: string;
  rawValue?: number | boolean | string;
}

function buildRows(s: GroupSettings): SettingsRow[] {
  return [
    {
      field: "contribution_amount",
      label: "Contribution amount",
      value: `${s.contributionAmount.toLocaleString()} RWF / cycle`,
      rawValue: s.contributionAmount,
    },
    {
      field: "cycle_length",
      label: "Cycle length",
      value: `${s.cycleLength} days`,
      rawValue: s.cycleLength,
    },
    {
      field: "penalty_rate",
      label: "Penalty rate",
      value: `${s.penaltyRate}%`,
      rawValue: s.penaltyRate,
    },
    {
      field: "payout_amount",
      label: "Payout amount",
      value: `${s.payoutAmount.toLocaleString()} RWF / cycle`,
      rawValue: s.payoutAmount,
    },
    {
      field: "approval_threshold",
      label: "Approval threshold",
      value: formatThreshold(s.approvalThreshold),
      rawValue: s.approvalThreshold,
    },
    {
      field: "committee_size",
      label: "Committee",
      value: s.allMembersAreCommittee ? "All members" : `${s.committeeSize} members`,
      rawValue: s.allMembersAreCommittee ? 0 : s.committeeSize,
    },
    {
      field: "loan_interest_rate",
      label: "Loan interest rate",
      value: s.loansEnabled ? `${s.loanInterestRate}% flat` : "Disabled",
      rawValue: s.loanInterestRate,
    },
    {
      field: "discretionary_fund",
      label: "Discretionary fund",
      value: s.discretionaryFundEnabled ? "Enabled" : "Disabled",
      rawValue: s.discretionaryFundEnabled,
    },
    {
      field: "group_policy",
      label: "Group policy",
      value: s.groupPolicy === "public" ? "Public" : "Private",
      rawValue: s.groupPolicy,
    },
  ];
}

function formatThreshold(v: number): string {
  if (v === 0.5) return "1 of 2";
  if (v >= 1) return "All";
  return "2 of 3";
}

export default function GroupSettingsScreen(): JSX.Element {
  const { activeGroupId } = useStore($activeGroup);
  const auth = useStore($auth);
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [activeField, setActiveField] = useState<SettingsRow | null>(null);

  const { data: settingsData, isLoading } = useSWR(
    activeGroupId && auth?.id ? `group-settings:${activeGroupId}` : null,
    () =>
      Promise.all([
        api.groups.getGroupSettings(activeGroupId!),
        api.groups.getMemberDetail(activeGroupId!, auth!.id, auth!.id),
        api.groups.getGroupDetails(activeGroupId!),
      ]),
  );

  const settings = settingsData?.[0] ?? null;
  const memberDetail = settingsData?.[1] ?? null;
  const group = settingsData?.[2] ?? null;

  const groupName = (group?.name as string) ?? "";
  const groupInitials = (group?.avatarInitials as string) ?? "";
  const groupCreatedAt = new Date().toLocaleDateString("en-RW", {
    year: "numeric",
    month: "long",
  });
  const isCommittee = memberDetail?.isCommitteeMember ?? false;

  const handleRowPress = useCallback((row: SettingsRow) => {
    setActiveField(row);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    (proposedValue: string) => {
      if (!activeGroupId || !auth?.id || !activeField) return;
      api.groups
        .submitSettingsChange(activeGroupId, activeField.field, proposedValue, auth.id)
        .then(() => {
          setModalOpen(false);
          toast.show({
            variant: "success",
            label: "Change submitted",
            description: "Your request has been sent to the committee for approval.",
          });
          return;
        })
        .catch(() => {
          toast.show({ variant: "danger", label: "Failed to submit change" });
        });
    },
    [activeGroupId, auth, activeField, toast],
  );

  if (isLoading || !settings) {
    return (
      <ScreenContainer>
        <Header title="Group settings" canGoBack />
        <View className="flex-1 items-center justify-center">
          <AppText className="text-muted text-base">Loading...</AppText>
        </View>
      </ScreenContainer>
    );
  }

  const rows = buildRows(settings);

  return (
    <ScreenContainer>
      <Header title="Group settings" canGoBack />
      <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-36">
          <View className="px-4 pt-4 gap-4">
            {/* Group info header */}
            <ListGroup>
              <ListGroup.Item disabled>
                <ListGroup.ItemPrefix>
                  <Avatar size="sm" color="accent">
                    <Avatar.Fallback>{groupInitials}</Avatar.Fallback>
                  </Avatar>
                </ListGroup.ItemPrefix>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{groupName}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription className="text-muted">
                    Created {groupCreatedAt}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
              </ListGroup.Item>
            </ListGroup>

            {/* Settings rows */}
            <ListGroup>
              {rows.map((row, index) => (
                <Fragment key={row.field}>
                  {index > 0 && <Separator className="mx-4" />}
                  <PressableFeedback animation={false} onPress={() => handleRowPress(row)}>
                    <PressableFeedback.Scale>
                      <ListGroup.Item>
                        <ListGroup.ItemContent>
                          <ListGroup.ItemTitle>{row.label}</ListGroup.ItemTitle>
                        </ListGroup.ItemContent>
                        <View className="flex-row items-center gap-1">
                          <AppText className="text-sm text-muted">{row.value}</AppText>
                          <StyledIonicons name="chevron-forward" size={16} className="text-muted" />
                        </View>
                      </ListGroup.Item>
                    </PressableFeedback.Scale>
                    <PressableFeedback.Ripple />
                  </PressableFeedback>
                </Fragment>
              ))}
            </ListGroup>
          </View>
        </ScrollView>
      </ScrollShadow>

      {activeField && (
        <SettingsModal
          isOpen={modalOpen}
          onOpenChange={setModalOpen}
          field={activeField.field}
          fieldLabel={activeField.label}
          currentValue={activeField.value}
          rawValue={activeField.rawValue}
          isCommitteeMember={isCommittee}
          approvalThreshold={settings.approvalThreshold}
          committeeSize={settings.committeeSize}
          onSubmit={handleSubmit}
        />
      )}
    </ScreenContainer>
  );
}
