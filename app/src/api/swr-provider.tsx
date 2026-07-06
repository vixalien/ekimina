import type { JSX, ReactNode } from "react";
import type { AppStateStatus } from "react-native";

import { AppState } from "react-native";
import { SWRConfig } from "swr";

export function SwrProvider({ children }: { children: ReactNode }): JSX.Element {
  return (
    <SWRConfig
      value={{
        provider: () => new Map(),
        isVisible: () => AppState.currentState === "active",
        initFocus(callback) {
          let appState = AppState.currentState;
          const onAppStateChange = (nextAppState: AppStateStatus) => {
            if (appState.match(/inactive|background/) && nextAppState === "active") {
              callback();
            }
            appState = nextAppState;
          };
          const subscription = AppState.addEventListener("change", onAppStateChange);
          return () => subscription.remove();
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
