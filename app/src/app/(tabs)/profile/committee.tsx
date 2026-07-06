import type { JSX } from "react";

import type { MemberListItem } from "@/api";

import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Button,
  ControlField,
  Description,
  Label,
  ScrollShadow,
  Separator,
  Surface,
  useToast,
} from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import useSWR from "swr";
import { withUniwind } from "uniwind";

import { api } from "@/api";
import { AppText } from "@/components/ui/app-text";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import { $activeGroup } from "@/stores/active-group";
import { $auth } from "@/stores/auth";

const StyledIonicons = withUniwind(Ionicons);

function MemberSwitchField({
  member,
  isSelected,
  onSelectedChange,
  isDisabled,
}: {
  member: MemberListItem;
  isSelected: boolean;
  onSelectedChange: (value: boolean) => void;
  isDisabled: boolean;
}) {
  return (
    <ControlField
      isSelected={isSelected}
      onSelectedChange={onSelectedChange}
      isDisabled={isDisabled}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View className="size-8 rounded-full bg-accent/10 items-center justify-center">
          <AppText className="text-xs font-medium text-accent">{member.initials}</AppText>
        </View>
        <View className="flex-1">
          <Label>
            <Label.Text>{member.name}</Label.Text>
          </Label>
          <Description>{member.address}</Description>
        </View>
      </View>
      <ControlField.Indicator />
    </ControlField>
  );
}

export default function CommitteeScreen(): JSX.Element {
  const { activeGroupId } = useStore($activeGroup);
  const auth = useStore($auth);
  const { toast } = useToast();

  const [committeeUserIds, setCommitteeUserIds] = useState<Set<string>>(new Set());
  const [originalCommittee, setOriginalCommittee] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const { data: committeeData, isLoading } = useSWR(
    activeGroupId && auth?.id ? `committee:${activeGroupId}` : null,
    () =>
      Promise.all([
        api.groups.getGroupMembers(activeGroupId!),
        api.groups.getCommitteeMembers(activeGroupId!),
        api.groups.getGroupSettings(activeGroupId!),
        api.groups.getMemberDetail(activeGroupId!, auth!.id, auth!.id),
      ]),
  );

  const allMembers = committeeData?.[0] ?? [];
  const committeeMembers = committeeData?.[1] ?? [];
  const settings = committeeData?.[2] ?? null;
  const memberDetail = committeeData?.[3] ?? null;

  const isCommittee = memberDetail?.isCommitteeMember ?? false;

  useEffect(() => {
    if (committeeMembers.length > 0) {
      const ids = new Set<string>(committeeMembers.map((m) => m.userId));
      setCommitteeUserIds(ids);
      setOriginalCommittee(ids);
    }
  }, [committeeMembers]);

  const handleToggle = useCallback(
    (userId: string) => (value: boolean) => {
      setCommitteeUserIds((prev) => {
        const next = new Set(prev);
        if (value) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    },
    [],
  );

  const hasChanges =
    committeeUserIds.size !== originalCommittee.size ||
    [...committeeUserIds].some((id) => !originalCommittee.has(id));

  const handleApprove = useCallback(async () => {
    if (!activeGroupId || !auth?.id) return;
    setSubmitting(true);
    try {
      await api.groups.submitSettingsChange(
        activeGroupId,
        "committee_size",
        String(committeeUserIds.size),
        auth.id,
      );
      setOriginalCommittee(new Set(committeeUserIds));
      toast.show({
        variant: "success",
        label: "Committee updated",
        description: "Your changes have been submitted for approval.",
      });
    } catch {
      toast.show({ variant: "danger", label: "Failed to update" });
    } finally {
      setSubmitting(false);
    }
  }, [activeGroupId, auth, committeeUserIds, toast]);

  if (isLoading || !settings) {
    return (
      <ScreenContainer>
        <Header title="Committee members" canGoBack />
        <View className="flex-1 items-center justify-center">
          <AppText className="text-muted text-base">Loading...</AppText>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title="Committee members" canGoBack />
      <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-4">
          <View className="px-4 pt-4 gap-6">
            {/* All members committee notice */}
            {settings.allMembersAreCommittee && (
              <Surface variant="secondary" className="p-4">
                <View className="flex-row items-center gap-3">
                  <StyledIonicons name="people" size={20} className="text-accent" />
                  <View className="flex-1">
                    <AppText className="text-sm font-semibold text-foreground">
                      All members are committee
                    </AppText>
                    <AppText className="text-xs text-muted mt-1">
                      Every member has committee signing privileges. Change this in Group settings.
                    </AppText>
                  </View>
                </View>
              </Surface>
            )}

            {/* Member list as Switch ControlField set */}
            {!settings.allMembersAreCommittee && (
              <View className="gap-4">
                <AppText className="text-xs text-muted uppercase tracking-wider ml-2">
                  Members
                </AppText>
                <Surface className="py-4 px-4">
                  {allMembers.map((member, index) => (
                    <View key={member.userId}>
                      {index > 0 && <Separator className="my-3" />}
                      <MemberSwitchField
                        member={member}
                        isSelected={committeeUserIds.has(member.userId)}
                        onSelectedChange={isCommittee ? handleToggle(member.userId) : () => {}}
                        isDisabled={!isCommittee}
                      />
                    </View>
                  ))}
                </Surface>

                {!isCommittee && (
                  <AppText className="text-xs text-muted ml-2">
                    Only committee members can change committee membership.
                  </AppText>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </ScrollShadow>

      {/* Floating approve button */}
      {isCommittee && hasChanges && (
        <View className="px-4 pb-6 pt-2">
          <Button variant="primary" onPress={handleApprove} isDisabled={submitting}>
            <Button.Label>{submitting ? "Submitting..." : "Approve changes"}</Button.Label>
          </Button>
        </View>
      )}
    </ScreenContainer>
  );
}
