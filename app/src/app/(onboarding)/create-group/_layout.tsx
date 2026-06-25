import type { JSX } from "react";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { resetGroup } from "../../../stores/group";
import { resetWizard } from "../../../stores/create-group";

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
