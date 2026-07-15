import type { JSX } from "react";

import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { LinearGradient } from "expo-linear-gradient";
import {
  BottomSheet,
  Button,
  ControlField,
  Description,
  Label,
  ListGroup,
  PressableFeedback,
  ScrollShadow,
  Separator,
} from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import useSWR from "swr";
import { withUniwind } from "uniwind";

import { api } from "@/api";
import { MemberAvatar } from "@/components/member-avatar";
import { AppText } from "@/components/ui/app-text";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import { nav } from "@/lib/routes";
import { $activeGroup } from "@/stores/active-group";
import { $auth } from "@/stores/auth";

const StyledIonicons = withUniwind(Ionicons);

export default function ProfileTab(): JSX.Element {
  const auth = useStore($auth);
  const { activeGroupId } = useStore($activeGroup);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const {
    data: profile,
    isLoading,
    error,
  } = useSWR(activeGroupId && auth?.id ? `profile:${activeGroupId}:${auth.id}` : null, () =>
    api.groups.getUserProfile(activeGroupId!, auth!.id),
  );

  useEffect(() => {
    if (profile) setNotificationsEnabled(profile.notificationsEnabled);
  }, [profile]);

  const handleLogout = useCallback(() => {
    // clearAuth();
    nav.toWelcome();
  }, []);

  const handleNotificationsToggle = useCallback(
    (value: boolean) => {
      setNotificationsEnabled(value);
      if (auth?.id) {
        api.groups.updateNotifications(auth.id, value).catch(() => {});
      }
    },
    [auth],
  );

  if (isLoading) {
    return (
      <ScreenContainer>
        <Header title="Profile" canGoBack={false} />
        <View className="flex-1 items-center justify-center">
          <AppText className="text-muted text-base">Loading...</AppText>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !profile) {
    return (
      <ScreenContainer>
        <Header title="Profile" canGoBack={false} />
        <View className="flex-1 items-center justify-center px-6 gap-6">
          <AppText className="text-muted text-base text-center">
            Failed to load profile{error ? `: ${error}` : ""}
          </AppText>
          <Button variant="danger" onPress={handleLogout}>
            <Button.Label>Log out</Button.Label>
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title="Profile" canGoBack={false} />
      <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-36">
          <View className="px-4 pt-4 gap-6">
            {/* Profile header */}
            <View className="flex-row items-center gap-4 px-2">
              <MemberAvatar initials={profile.initials} status="no_status" />
              <View className="flex-1 gap-1">
                <AppText className="text-lg font-semibold text-foreground">{profile.name}</AppText>
                <AppText className="text-sm text-muted">rep {profile.reputation}</AppText>
                {profile.onTimeStreak > 0 && (
                  <AppText className="text-xs text-success">
                    {profile.onTimeStreak} cycles on time
                  </AppText>
                )}
              </View>
            </View>

            {/* Settings rows */}
            <ListGroup>
              <PressableFeedback animation={false} onPress={nav.profile.toGroupSettings}>
                <PressableFeedback.Scale>
                  <ListGroup.Item>
                    <ListGroup.ItemContent>
                      <ListGroup.ItemTitle>Group settings</ListGroup.ItemTitle>
                    </ListGroup.ItemContent>
                    <ListGroup.ItemSuffix />
                  </ListGroup.Item>
                </PressableFeedback.Scale>
                <PressableFeedback.Ripple />
              </PressableFeedback>

              <Separator className="mx-4" />

              <PressableFeedback animation={false} onPress={nav.profile.toCommittee}>
                <PressableFeedback.Scale>
                  <ListGroup.Item>
                    <ListGroup.ItemContent>
                      <ListGroup.ItemTitle>Committee members</ListGroup.ItemTitle>
                    </ListGroup.ItemContent>
                    <ListGroup.ItemSuffix />
                  </ListGroup.Item>
                </PressableFeedback.Scale>
                <PressableFeedback.Ripple />
              </PressableFeedback>

              <Separator className="mx-4" />

              <PressableFeedback animation={false} onPress={() => setNotificationsOpen(true)}>
                <PressableFeedback.Scale>
                  <ListGroup.Item>
                    <ListGroup.ItemContent>
                      <ListGroup.ItemTitle>Notifications</ListGroup.ItemTitle>
                    </ListGroup.ItemContent>
                    <View className="flex-row items-center gap-1">
                      <AppText className="text-sm text-muted">
                        {notificationsEnabled ? "On" : "Off"}
                      </AppText>
                      <StyledIonicons name="chevron-forward" size={16} className="text-muted" />
                    </View>
                  </ListGroup.Item>
                </PressableFeedback.Scale>
                <PressableFeedback.Ripple />
              </PressableFeedback>

              <Separator className="mx-4" />

              <PressableFeedback animation={false} onPress={nav.profile.toLeaveGroupConfirm}>
                <PressableFeedback.Scale>
                  <ListGroup.Item>
                    <ListGroup.ItemContent>
                      <ListGroup.ItemTitle className="text-danger">Leave group</ListGroup.ItemTitle>
                    </ListGroup.ItemContent>
                    <StyledIonicons name="chevron-forward" size={16} className="text-danger" />
                  </ListGroup.Item>
                </PressableFeedback.Scale>
                <PressableFeedback.Ripple />
              </PressableFeedback>
            </ListGroup>

            <ListGroup>
              <PressableFeedback animation={false} onPress={handleLogout}>
                <PressableFeedback.Scale>
                  <ListGroup.Item>
                    <ListGroup.ItemContent>
                      <ListGroup.ItemTitle className="text-danger">Log out</ListGroup.ItemTitle>
                    </ListGroup.ItemContent>
                    <StyledIonicons name="log-out-outline" size={16} className="text-danger" />
                  </ListGroup.Item>
                </PressableFeedback.Scale>
                <PressableFeedback.Ripple />
              </PressableFeedback>
            </ListGroup>
          </View>
        </ScrollView>
      </ScrollShadow>

      {/* Notifications sheet */}
      <BottomSheet isOpen={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <BottomSheet.Title>Notifications</BottomSheet.Title>
            <View className="gap-4">
              <ControlField
                isSelected={notificationsEnabled}
                onSelectedChange={handleNotificationsToggle}
              >
                <View className="flex-1">
                  <Label>Push notifications</Label>
                  <Description>
                    Receive alerts for contributions, payouts, and group activity
                  </Description>
                </View>
                <ControlField.Indicator />
              </ControlField>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </ScreenContainer>
  );
}
