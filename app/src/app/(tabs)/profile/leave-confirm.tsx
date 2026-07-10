import type { JSX } from "react";

import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Button,
  ListGroup,
  PressableFeedback,
  ScrollShadow,
  Separator,
  Surface,
} from "heroui-native";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import useSWR from "swr";
import { withUniwind } from "uniwind";

import { api } from "@/api";
import { AppText } from "@/components/ui/app-text";
import { ScreenContainer } from "@/components/ui/screen-container";
import { nav } from "@/lib/routes";
import { $activeGroup } from "@/stores/active-group";
import { $auth } from "@/stores/auth";

const StyledIonicons = withUniwind(Ionicons);

function goBack() {
  nav.back();
}

export default function LeaveGroupConfirm(): JSX.Element {
  const { activeGroupId } = useStore($activeGroup);
  const auth = useStore($auth);
  const { data: info, isLoading } = useSWR(
    activeGroupId && auth?.id ? `leave-info:${activeGroupId}:${auth.id}` : null,
    () => api.groups.getLeaveGroupInfo(activeGroupId!, auth!.id),
  );

  const [leaving, setLeaving] = useState(false);

  const handleLeave = useCallback(async () => {
    if (!activeGroupId || !auth?.id || leaving) return;
    setLeaving(true);
    try {
      await api.groups.leaveGroup(activeGroupId, auth.id);
      nav.profile.toLeaveGroupSent();
    } catch {
      // error handled silently
    } finally {
      setLeaving(false);
    }
  }, [activeGroupId, auth?.id, leaving]);

  if (isLoading || !info) {
    return (
      <ScreenContainer className="items-center justify-center">
        <AppText className="text-muted text-base">Loading...</AppText>
      </ScreenContainer>
    );
  }

  const hasLoan =
    info.outstandingLoanAmount !== null &&
    info.outstandingLoanAmount !== undefined &&
    info.outstandingLoanAmount > 0;

  return (
    <ScreenContainer>
      <View className="flex-1 px-4 pt-12 gap-6">
        {/* Back button */}
        <PressableFeedback animation={false} onPress={goBack}>
          <View className="size-10 items-center justify-center rounded-full bg-surface-secondary">
            <StyledIonicons name="arrow-back" size={22} className="text-foreground" />
          </View>
        </PressableFeedback>

        <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="items-center gap-4 mb-6">
              <View className="size-16 items-center justify-center rounded-full bg-danger/10">
                <StyledIonicons name="warning-outline" size={32} className="text-danger" />
              </View>
              <AppText className="text-2xl font-semibold text-foreground text-center">
                Leave {info.groupName}?
              </AppText>
              <AppText className="text-base text-muted text-center leading-5">
                {info.isMidCycle
                  ? "The group is mid cycle, so your request will be reviewed by the committee before you are removed."
                  : "Your request will be reviewed by the committee before you are removed."}
              </AppText>
            </View>

            <Surface variant="secondary" className="rounded-xl overflow-hidden">
              <ListGroup>
                <ListGroup.Item>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Contributions</ListGroup.ItemTitle>
                  </ListGroup.ItemContent>
                  <AppText className="text-sm text-foreground">{info.contributionStanding}</AppText>
                </ListGroup.Item>
                <Separator className="mx-4" />
                <ListGroup.Item>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Outstanding loans</ListGroup.ItemTitle>
                  </ListGroup.ItemContent>
                  <AppText
                    className={`text-sm font-medium ${hasLoan ? "text-danger" : "text-muted"}`}
                  >
                    {hasLoan ? `${info.outstandingLoanAmount?.toLocaleString()} RWF` : "None"}
                  </AppText>
                </ListGroup.Item>
              </ListGroup>
            </Surface>
          </ScrollView>
        </ScrollShadow>

        <View className="flex-row gap-3 pb-8">
          <View className="flex-1">
            <Button variant="secondary" onPress={goBack}>
              <Button.Label>Cancel</Button.Label>
            </Button>
          </View>
          <View className="flex-1">
            <Button variant="danger-soft" onPress={handleLeave} isDisabled={leaving}>
              <Button.Label>Continue</Button.Label>
            </Button>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
