import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useStore } from "@nanostores/react";
import type { ComponentProps, JSX } from "react";
import { startTransition, useEffect, useState } from "react";
import type { ColorValue } from "react-native";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { api } from "../../api";
import type { GroupMembership } from "../../api/types";
import { GroupSwitcher } from "../../components/group-switcher";
import { TopBar } from "../../components/top-bar";
import { $auth } from "../../stores/auth";
import {
  $activeGroup,
  dismissSwitcherOnMount,
  setMemberships,
  switchGroup,
} from "../../stores/active-group";
import { initialsOf } from "../../lib/strings";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const StyledIonicons = withUniwind(Ionicons);

function TabIcon({
  name,
  focused,
  color,
}: {
  name: IoniconName;
  focused: boolean;
  color: ColorValue;
}): JSX.Element {
  const iconName: IoniconName = focused ? name : (`${name}-outline` as IoniconName);
  return <StyledIonicons name={iconName} size={22} color={color} />;
}

function ActivityIcon({
  focused,
  color,
}: {
  focused: boolean;
  color: ColorValue;
}): JSX.Element {
  const hasPending = true;

  return (
    <View className="relative">
      <TabIcon name="pulse" focused={focused} color={color} />
      {hasPending && !focused && (
        <View className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-danger" />
      )}
    </View>
  );
}

export default function TabsLayout(): JSX.Element {
  const auth = useStore($auth);
  const activeGroup = useStore($activeGroup);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const backgroundColor = String(useThemeColor("background"));
  const borderColor = String(useThemeColor("border"));
  const accentColor = String(useThemeColor("accent"));
  const mutedColor = String(useThemeColor("muted"));

  const activeMembership = activeGroup.memberships.find(
    (m) => m.group.id === activeGroup.activeGroupId,
  );
  const groupName = activeMembership?.group.name ?? "";

  const userInitials =
    auth?.name ? initialsOf(auth.name) : auth?.phone?.slice(-4) ?? "?";

  useEffect(() => {
    const a = auth;
    if (!a) return;
    const userId = a.phone ?? a.userId ?? "";
    async function load() {
      try {
        const memberships = await api.groups.myGroups(userId);
        startTransition(() => setMemberships(memberships));
      } catch {
        // ignore
      }
    }
    load();
  }, [auth]);

  useEffect(() => {
    if (activeGroup.showSwitcherOnMount) {
      dismissSwitcherOnMount();
      startTransition(() => setIsSwitcherOpen(true));
    }
  }, [activeGroup.showSwitcherOnMount]);

  function openSwitcher() {
    setIsSwitcherOpen(true);
  }

  function handleSelectGroup(membership: GroupMembership) {
    switchGroup(membership.group.id);
    setIsSwitcherOpen(false);
  }

  function handleJoinOrCreate() {
    setIsSwitcherOpen(false);
    router.push("/(onboarding)/join-or-create");
  }

  return (
    <View className="flex-1 bg-background">
      <TopBar
        groupName={groupName}
        userInitials={userInitials}
        onPress={openSwitcher}
      />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: accentColor,
          tabBarInactiveTintColor: mutedColor,
          tabBarStyle: {
            backgroundColor,
            borderTopColor: borderColor,
            borderTopWidth: 0.5,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: "500" as const },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="home" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="members"
          options={{
            title: "Members",
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="people" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: "Activity",
            tabBarIcon: ({ focused, color }) => (
              <ActivityIcon focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="person" focused={focused} color={color} />
            ),
          }}
        />
      </Tabs>

      <GroupSwitcher
        isOpen={isSwitcherOpen}
        onOpenChange={setIsSwitcherOpen}
        memberships={activeGroup.memberships}
        activeGroupId={activeGroup.activeGroupId ?? undefined}
        onSelectGroup={handleSelectGroup}
        onJoinOrCreate={handleJoinOrCreate}
      />
    </View>
  );
}
