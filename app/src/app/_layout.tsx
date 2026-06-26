import type { JSX } from "react";
import { useEffect } from "react";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
  useFonts,
} from "@expo-google-fonts/inter";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import { SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { $authLoading, clearAuth, setAuth } from "../stores/auth";
import { clearAuthStorage, loadAuth, saveAuth } from "../lib/auth-storage";
import { api } from "../api";
import { Routes } from "../lib/routes";

import "../global.css";

SplashScreen.setOptions({ duration: 300, fade: true });

export default function RootLayout(): JSX.Element | null {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
    SpaceGrotesk_700Bold,
    JetBrainsMono_400Regular,
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    async function bootstrap() {
      $authLoading.set(true);
      try {
        const stored = await loadAuth();
        if (!stored) {
          router.replace(Routes.welcome);
          return;
        }

        const status = await api.auth.getStatus(stored.token);
        const user = {
          phone: status.user.phone,
          token: stored.token,
          accountType: "existing" as const,
          name: status.user.name,
          userId: status.user.id,
        };
        setAuth(user);
        await saveAuth(user);

        switch (status.groupStatus) {
          case "one_group":
          case "multiple_groups":
            router.replace(Routes.tabs);
            break;
          case "invitation_pending":
            router.replace({
              pathname: Routes.onboarding.pending,
              params: status.pendingRequest ?? {},
            });
            break;
          case "no_groups":
            router.replace(Routes.onboarding.joinOrCreate);
            break;
          default:
            router.replace(Routes.welcome);
        }
      } catch {
        clearAuth();
        await clearAuthStorage();
        router.replace(Routes.welcome);
      } finally {
        $authLoading.set(false);
      }
    }

    bootstrap();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <HeroUINativeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="welcome" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style="auto" />
        </HeroUINativeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
