import "../global.css";

import type { JSX } from "react";

import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/sora";
import { SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { loadAuth } from "../lib/auth-storage";
import { Routes } from "../lib/routes";
import { $authLoading } from "../stores/auth";

SplashScreen.setOptions({ duration: 300, fade: true });

export default function RootLayout(): JSX.Element | null {
  const bootstrappedRef = useRef(false);
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_400Regular,
  });

  useEffect(() => {
    if (bootstrappedRef.current) return;
    if (!fontsLoaded) return;

    async function bootstrap() {
      $authLoading.set(true);
      try {
        const stored = await loadAuth();
        if (!stored) {
          router.replace(Routes.welcome);
          return;
        }
        router.replace(Routes.tabs);
      } catch {
        router.replace(Routes.welcome);
      } finally {
        $authLoading.set(false);
        bootstrappedRef.current = true;
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
          {/* oxlint-disable-next-line react/style-prop-object — expo-status-bar accepts string style */}
          <StatusBar style="auto" />
        </HeroUINativeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
