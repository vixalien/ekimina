import type { JSX } from "react";

import { Stack } from "expo-router";
import { useEffect } from "react";

import { resetWizard } from "../../../stores/create-group";
import { resetGroup } from "../../../stores/group";

export default function CreateGroupLayout(): JSX.Element {
  useEffect(() => {
    return () => {
      resetGroup();
      resetWizard();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}
