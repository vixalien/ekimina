import type { JSX } from "react";
import { useStore } from "@nanostores/react";
import { Redirect } from "expo-router";
import { $authLoading } from "../stores/auth";
import { Routes } from "../lib/routes";

export default function Index(): JSX.Element | null {
  const authLoading = useStore($authLoading);
  if (authLoading) return null;
  return <Redirect href={Routes.welcome} />;
}
