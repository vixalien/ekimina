import type { JSX } from "react";

import { useStore } from "@nanostores/react";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Chip, InputGroup, ScrollShadow, TextField, useToast } from "heroui-native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import useSWR from "swr";

import { api } from "@/api";
import { AppText } from "@/components/ui/app-text";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import { nav } from "@/lib/routes";
import { $activeGroup } from "@/stores/active-group";
import { $auth } from "@/stores/auth";

const CATEGORIES = ["Social fund", "Asset purchase", "Asset sale", "Other"];

export default function DiscretionaryRequestScreen(): JSX.Element {
  const { activeGroupId } = useStore($activeGroup);
  const auth = useStore($auth);
  const { toast } = useToast();

  const [direction, setDirection] = useState<"deposit" | "withdrawal">("deposit");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paidTo, setPaidTo] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: settings = null } = useSWR(
    activeGroupId ? `disc-settings:${activeGroupId}` : null,
    () => api.groups.getGroupSettings(activeGroupId!),
  );

  const handleSubmit = useCallback(async () => {
    if (!activeGroupId || !auth?.id || !amount) return;
    setSubmitting(true);
    const id = toast.show({
      variant: "default",
      label: "Submitting request...",
      duration: "persistent",
    });
    try {
      await api.groups.submitDiscretionaryRequest(activeGroupId, auth.id, {
        direction,
        amount: parseInt(amount, 10),
        category,
        paidTo,
        reason,
      });
      toast.hide(id);
      toast.show({
        variant: "success",
        label: "Request submitted",
        description: "The committee will review your request.",
      });
      nav.back();
    } catch {
      toast.hide(id);
      toast.show({ variant: "danger", label: "Failed to submit" });
    } finally {
      setSubmitting(false);
    }
  }, [activeGroupId, auth, amount, direction, category, paidTo, reason, toast]);

  const threshold = settings
    ? `Requires ${Math.round(settings.approvalThreshold * settings.committeeSize)} of ${settings.committeeSize} committee signatures before funds move`
    : "";

  return (
    <ScreenContainer>
      <Header
        title="New request"
        canGoBack={false}
        options={
          <Pressable onPress={() => nav.back()} hitSlop={8}>
            <AppText className="text-foreground text-lg">X</AppText>
          </Pressable>
        }
      />
      <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-4"
        >
          <View className="px-6 pt-4 gap-5">
            {/* Direction toggle */}
            <View className="flex-row gap-3">
              {(["deposit", "withdrawal"] as const).map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDirection(d)}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    direction === d
                      ? "bg-accent/10 border-accent"
                      : "bg-surface-secondary border-transparent"
                  }`}
                >
                  <AppText
                    className={`text-sm font-medium ${
                      direction === d ? "text-accent" : "text-muted"
                    }`}
                  >
                    {d === "deposit" ? "Deposit" : "Withdrawal"}
                  </AppText>
                </Pressable>
              ))}
            </View>

            {/* Amount */}
            <TextField isRequired>
              <InputGroup>
                <InputGroup.Input
                  placeholder="0"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <InputGroup.Suffix className="pr-3">
                  <AppText className="text-sm text-muted font-medium">RWF</AppText>
                </InputGroup.Suffix>
              </InputGroup>
            </TextField>

            {/* Category chips */}
            <View>
              <AppText className="text-xs text-muted font-medium mb-2">Category</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                <View className="flex-row gap-2">
                  {CATEGORIES.map((c) => (
                    <Chip
                      key={c}
                      variant={category === c ? "primary" : "soft"}
                      color="accent"
                      onPress={() => setCategory(c)}
                    >
                      <Chip.Label>{c}</Chip.Label>
                    </Chip>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Paid to */}
            <TextField>
              <InputGroup>
                <InputGroup.Input placeholder="Paid to" value={paidTo} onChangeText={setPaidTo} />
              </InputGroup>
            </TextField>

            {/* Reason */}
            <TextField>
              <InputGroup>
                <InputGroup.Input
                  placeholder="Explain what the funds are for..."
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  className="min-h-[100px]"
                />
              </InputGroup>
            </TextField>

            {/* Helper note */}
            {threshold && (
              <AppText className="text-xs text-muted text-center leading-4">{threshold}</AppText>
            )}
          </View>
        </ScrollView>
      </ScrollShadow>

      {/* Floating buttons */}
      <View className="px-4 pb-6 pt-2 gap-3">
        <Button variant="primary" onPress={handleSubmit} isDisabled={!amount || submitting}>
          <Button.Label>{submitting ? "Submitting..." : "Submit for approval"}</Button.Label>
        </Button>
        <Button variant="secondary" onPress={() => nav.back()}>
          <Button.Label>Cancel</Button.Label>
        </Button>
      </View>
    </ScreenContainer>
  );
}
