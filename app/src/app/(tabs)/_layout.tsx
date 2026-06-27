import type { ComponentProps, JSX } from "react";
import { startTransition, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Tabs as HeroTabs, useThemeColor } from "heroui-native";
import { Tabs, TabList, TabSlot, TabTrigger } from "expo-router/ui";
import { router, usePathname } from "expo-router";
import { useStore } from "@nanostores/react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { api } from "../../api";
import { $auth } from "../../stores/auth";
import { setMemberships } from "../../stores/active-group";

const StyledIonicons = withUniwind(Ionicons);

type IoniconName = ComponentProps<typeof Ionicons>["name"];
type TabValue = "home" | "members" | "activity" | "profile";

const TABS: {
  name: string;
  href: string;
  value: TabValue;
  icon: IoniconName;
  iconActive: IoniconName;
}[] = [
  { name: "(home)", href: "/(tabs)/(home)", value: "home", icon: "home-outline", iconActive: "home" },
  { name: "(members)", href: "/(tabs)/(members)", value: "members", icon: "people-outline", iconActive: "people" },
  { name: "(activity)", href: "/(tabs)/(activity)", value: "activity", icon: "pulse-outline", iconActive: "pulse" },
  { name: "(profile)", href: "/(tabs)/(profile)", value: "profile", icon: "person-outline", iconActive: "person" },
];

const TAB_ROUTES: Record<TabValue, string> = {
  home: "/(tabs)/(home)",
  members: "/(tabs)/(members)",
  activity: "/(tabs)/(activity)",
  profile: "/(tabs)/(profile)",
};

function getActiveTab(pathname: string): TabValue {
  if (pathname.includes("/(members)")) return "members";
  if (pathname.includes("/(activity)")) return "activity";
  if (pathname.includes("/(profile)")) return "profile";
  return "home";
}

function HeroTabBar(): JSX.Element {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const activeValue = getActiveTab(pathname);
  const backgroundColor = String(useThemeColor("background"));
  const borderColor = String(useThemeColor("border"));

  function handleTabChange(value: string) {
    const route = TAB_ROUTES[value as TabValue];
    if (route) router.navigate(route as any);
  }

  return (
    <View
      style={{
        backgroundColor,
        borderTopWidth: 0.5,
        borderTopColor: borderColor,
        paddingBottom: insets.bottom,
      }}
    >
      <HeroTabs value={activeValue} onValueChange={handleTabChange}>
        <HeroTabs.List className="h-14 mx-4 rounded-none bg-transparent gap-0">
          <HeroTabs.Indicator />
          {TABS.map((tab) => (
            <HeroTabs.Trigger key={tab.value} value={tab.value} className="flex-1">
              <StyledIonicons
                name={activeValue === tab.value ? tab.iconActive : tab.icon}
                size={22}
                className={activeValue === tab.value ? "text-accent" : "text-muted"}
              />
            </HeroTabs.Trigger>
          ))}
        </HeroTabs.List>
      </HeroTabs>
    </View>
  );
}

export default function TabsLayout(): JSX.Element {
  const auth = useStore($auth);

  // Load memberships whenever auth changes -- shared across all tabs via store
  useEffect(() => {
    if (!auth) return;
    const userId = auth.phone ?? auth.userId ?? "";
    api.groups
      .myGroups(userId)
      .then((memberships) => startTransition(() => setMemberships(memberships)))
      .catch(() => {});
  }, [auth]);

  return (
    <Tabs style={{ flex: 1 }}>
      {/* Active screen content */}
      <View style={{ flex: 1 }}>
        <TabSlot />
      </View>

      {/* HeroUI visual tab bar */}
      <HeroTabBar />

      {/* Hidden TabList registers routes with the headless tab navigator */}
      <TabList style={{ height: 0, overflow: "hidden" }}>
        {TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href as any} />
        ))}
      </TabList>
    </Tabs>
  );
}
