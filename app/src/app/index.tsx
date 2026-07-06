import type { JSX } from "react";

import { useStore } from "@nanostores/react";
import { Redirect } from "expo-router";

import { Routes } from "../lib/routes";
import { $authLoading } from "../stores/auth";

export default function Index(): JSX.Element | null {
  const authLoading = useStore($authLoading);
  if (authLoading) return null;
  return <Redirect href={Routes.welcome} />;
}
