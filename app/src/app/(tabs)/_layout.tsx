import type { ComponentProps, JSX } from "react";
import type { ColorValue } from "react-native";

import type { Address } from "@/api";

import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { Tabs } from "expo-router";
import { startTransition, useEffect } from "react";

import { dataClient } from "@/api";

import { setMemberships } from "../../stores/active-group";
import { $auth } from "../../stores/auth";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const TABS: {
  name: string;
  icon: IoniconName;
  label: string;
}[] = [
  {
    name: "home",
    icon: "home-outline",
    label: "Home",
  },
  {
    name: "members",
    icon: "people-outline",
    label: "Members",
  },
  {
    name: "activity",
    icon: "pulse-outline",
    label: "Activity",
  },
  {
    name: "profile",
    icon: "person-outline",
    label: "Profile",
  },
];

function TabBarIcon({ color, icon }: { color: ColorValue; icon: IoniconName }): JSX.Element {
  return <Ionicons size={28} name={icon} color={color} />;
}

export default function TabLayout() {
  const auth = useStore($auth);

  useEffect(() => {
    if (!auth) return;
    const userId = auth.phone ?? auth.id ?? "";
    dataClient.groups
      .myGroups(userId as Address)
      .then((memberships: any) => startTransition(() => setMemberships(memberships)))
      .catch(() => {});
  }, [auth]);

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "blue", headerShown: false }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color }) => <TabBarIcon color={color} icon={tab.icon} />, // oxlint-disable-line react/no-unstable-nested-components
          }}
        />
      ))}
    </Tabs>
  );
}

// import type { ComponentProps, JSX } from "react";
// import { startTransition, useEffect, useState } from "react";
// import { Ionicons } from "@expo/vector-icons";
// import { Tabs as HeroTabs } from "heroui-native";
// import { Tabs, TabList, TabSlot, TabTrigger } from "expo-router/ui";
// import { useStore } from "@nanostores/react";
// import { View } from "react-native";
// import { withUniwind } from "uniwind";

// import { dataClient } from "@/api";
// import { $auth } from "../../stores/auth";
// import { setMemberships } from "../../stores/active-group";

// const StyledIonicons = withUniwind(Ionicons);

// type IoniconName = ComponentProps<typeof Ionicons>["name"];
// type TabValue = "home" | "members" | "activity" | "profile";

// const TABS: {
//   name: string;
//   href: string;
//   value: TabValue;
//   icon: IoniconName;
// }[] = [
//   {
//     name: "(home)",
//     href: "/(tabs)/(home)",
//     value: "home",
//     icon: "home-outline",
//   },
//   {
//     name: "(members)",
//     href: "/(tabs)/(members)",
//     value: "members",
//     icon: "people-outline",
//   },
//   {
//     name: "(activity)",
//     href: "/(tabs)/(activity)",
//     value: "activity",
//     icon: "pulse-outline",
//   },
//   {
//     name: "(profile)",
//     href: "/(tabs)/(profile)",
//     value: "profile",
//     icon: "person-outline",
//   },
// ];

// function HeroTabBar(): JSX.Element {
//   const [activeTab, setActiveTab] = useState<TabValue>("home");

//   return (
//     <View className="self-center mb-8 absolute bottom-2">
//       <HeroTabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
//         <HeroTabs.List className="shadow-lg p-1.5">
//           <HeroTabs.Indicator />
//           {TABS.map((tab) => (
//             <HeroTabs.Trigger key={tab.value} value={tab.value} asChild>
//               <TabTrigger name={tab.name}>
//                 <StyledIonicons name={tab.icon} size={32} className="text-muted" />
//               </TabTrigger>
//             </HeroTabs.Trigger>
//           ))}
//         </HeroTabs.List>
//       </HeroTabs>
//     </View>
//   );
// }

// export default function TabsLayout(): JSX.Element {
//   const auth = useStore($auth);

//   // Load memberships whenever auth changes -- shared across all tabs via store
//   useEffect(() => {
//     if (!auth) return;
//     const userId = auth.phone ?? auth.id ?? "";
//     dataClient.groups
//       .myGroups(userId)
//       .then((memberships) => startTransition(() => setMemberships(memberships)))
//       .catch(() => {});
//   }, [auth]);

//   return (
//     <Tabs style={{ flex: 1 }}>
//       {/* Active screen -- fills full height, tab bar floats over it */}
//       <TabSlot />

//       {/* Floating HeroUI tab bar */}
//       <HeroTabBar />

//       {/* Hidden TabList registers routes with the headless tab navigator */}
//       <TabList style={{ height: 0, overflow: "hidden" }}>
//         {TABS.map((tab) => (
//           <TabTrigger key={tab.name} name={tab.name} href={tab.href as any} />
//         ))}
//       </TabList>
//     </Tabs>
//   );
// }
