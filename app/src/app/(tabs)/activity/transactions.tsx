import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { Chip, ListGroup, PressableFeedback, ScrollShadow } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import type { JSX } from "react";
import { startTransition, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { withUniwind } from "uniwind";
import { dataClient } from "@/api";
import type { MemberListItem, Transaction, TransactionType } from "@/api";
import { CycleFilterSheet } from "@/components/activity/cycle-filter-sheet";
import type { CycleRange } from "@/components/activity/cycle-filter-sheet";
import { DateFilterSheet, DATE_LABELS } from "@/components/activity/date-filter-sheet";
import type { DatePreset } from "@/components/activity/date-filter-sheet";
import { MemberFilterSheet } from "@/components/activity/member-filter-sheet";
import { TransactionListItem } from "@/components/activity/transaction-list-item";
import { TRANSACTION_TYPE_LABELS } from "@/lib/activity-constants";
import { TypeFilterSheet } from "@/components/activity/type-filter-sheet";
import type { TypeFilterValue } from "@/components/activity/type-filter-sheet";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import { AppText } from "@/components/ui/app-text";
import { nav } from "@/lib/routes";
import { $activeGroup } from "@/stores/active-group";

const StyledIonicons = withUniwind(Ionicons);

type OpenSheet = "type" | "member" | "cycle" | "date" | null;

export default function TransactionsScreen(): JSX.Element {
  const { activeGroupId } = useStore($activeGroup);
  const params = useLocalSearchParams<{ type?: string; memberId?: string }>();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  // Filter state - initialize from route params if present
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>(
    (params.type as TypeFilterValue) ?? "all"
  );
  const [memberFilter, setMemberFilter] = useState<string[]>(
    params.memberId ? [params.memberId] : []
  );
  const [cycleFilter, setCycleFilter] = useState<CycleRange | null>(null);
  const [dateFilter, setDateFilter] = useState<DatePreset>("all");

  const hasTypeFilter = typeFilter !== "all";
  const hasMemberFilter = memberFilter.length > 0;
  const hasCycleFilter = cycleFilter !== null;
  const hasDateFilter = dateFilter !== "all";

  // Chip labels for active filters
  const typeLabel = hasTypeFilter
    ? TRANSACTION_TYPE_LABELS[typeFilter as TransactionType]
    : "All types";
  const memberLabel = hasMemberFilter
    ? memberFilter.length === 1
      ? (members.find((m) => m.userId === memberFilter[0])?.name.split(" ")[0] ?? "1 member")
      : `${memberFilter.length} members`
    : "All members";
  const cycleLabel = hasCycleFilter
    ? cycleFilter.from === cycleFilter.to
      ? `Cycle ${cycleFilter.from}`
      : `Cycle ${cycleFilter.from}\u2013${cycleFilter.to}`
    : "Cycle";
  const dateLabel = DATE_LABELS[dateFilter];

  useEffect(() => {
    if (!activeGroupId) return;
    dataClient.groups.getGroupMembers(activeGroupId).then((m: any) => startTransition(() => setMembers(m)));
  }, [activeGroupId]);

  useEffect(() => {
    if (!activeGroupId) return;
    startTransition(() => setLoading(true));
    const types = typeFilter !== "all" ? [typeFilter as TransactionType] : undefined;
    dataClient.groups
      .getTransactions(activeGroupId, {
        types,
        memberIds: memberFilter.length > 0 ? memberFilter : undefined,
        cycleRange: cycleFilter ?? undefined,
        datePreset: dateFilter !== "all" ? dateFilter : undefined,
      })
      .then((txns: any) =>
        startTransition(() => {
          setTransactions(txns);
          setLoading(false);
        })
      )
      .catch(() => setLoading(false));
  }, [activeGroupId, typeFilter, memberFilter, cycleFilter, dateFilter]);

  function clearAllFilters() {
    setTypeFilter("all");
    setMemberFilter([]);
    setCycleFilter(null);
    setDateFilter("all");
  }

  const anyFilterActive = hasTypeFilter || hasMemberFilter || hasCycleFilter || hasDateFilter;

  return (
    <ScreenContainer>
      <Header title="Transactions" canGoBack />

      {/* Filter chips row — sticky below header */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 py-3 gap-2"
        className="flex-none"
      >
        <Chip
          variant={hasTypeFilter ? "primary" : "secondary"}
          color={hasTypeFilter ? "accent" : "default"}
          onPress={() => setOpenSheet("type")}
        >
          <Chip.Label>{typeLabel}</Chip.Label>
          <StyledIonicons
            name="chevron-down"
            size={16}
            className={hasTypeFilter ? "text-accent-foreground" : "text-muted"}
          />
        </Chip>

        <Chip
          variant={hasMemberFilter ? "primary" : "secondary"}
          color={hasMemberFilter ? "accent" : "default"}
          onPress={() => setOpenSheet("member")}
        >
          <Chip.Label>{memberLabel}</Chip.Label>
          <StyledIonicons
            name="chevron-down"
            size={16}
            className={hasMemberFilter ? "text-accent-foreground" : "text-muted"}
          />
        </Chip>

        <Chip
          variant={hasCycleFilter ? "primary" : "secondary"}
          color={hasCycleFilter ? "accent" : "default"}
          onPress={() => setOpenSheet("cycle")}
        >
          <Chip.Label>{cycleLabel}</Chip.Label>
          <StyledIonicons
            name="chevron-down"
            size={16}
            className={hasCycleFilter ? "text-accent-foreground" : "text-muted"}
          />
        </Chip>

        <Chip
          variant={hasDateFilter ? "primary" : "secondary"}
          color={hasDateFilter ? "accent" : "default"}
          onPress={() => setOpenSheet("date")}
        >
          <Chip.Label>{dateLabel}</Chip.Label>
          <StyledIonicons
            name="chevron-down"
            size={16}
            className={hasDateFilter ? "text-accent-foreground" : "text-muted"}
          />
        </Chip>
      </ScrollView>

      {/* Transaction list */}
      <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-4 pt-1">
          {loading ? (
            <View className="flex-1 items-center justify-center py-16">
              <AppText className="text-muted text-base">Loading...</AppText>
            </View>
          ) : transactions.length === 0 ? (
            <View className="items-center justify-center py-16 gap-3">
              <StyledIonicons name="receipt-outline" size={40} className="text-muted" />
              <AppText className="text-muted text-base text-center">
                No transactions match these filters.
              </AppText>
              {anyFilterActive && (
                <PressableFeedback onPress={clearAllFilters}>
                  <AppText className="text-accent text-sm font-medium">Clear filters</AppText>
                </PressableFeedback>
              )}
            </View>
          ) : (
            <ListGroup>
              {transactions.map((tx, index) => (
                <TransactionListItem
                  key={tx.id}
                  transaction={tx}
                  showSeparator={index > 0}
                  onPress={() => nav.activity.toDetail(tx.id)}
                />
              ))}
            </ListGroup>
          )}
        </ScrollView>
      </ScrollShadow>

      {/* Filter sheets */}
      <TypeFilterSheet
        isOpen={openSheet === "type"}
        onOpenChange={(open) => !open && setOpenSheet(null)}
        value={typeFilter}
        onValueChange={(val) => {
          setTypeFilter(val);
          setOpenSheet(null);
        }}
      />
      <MemberFilterSheet
        isOpen={openSheet === "member"}
        onOpenChange={(open) => !open && setOpenSheet(null)}
        members={members}
        selectedIds={memberFilter}
        onSelectionChange={(ids) => {
          setMemberFilter(ids);
          setOpenSheet(null);
        }}
      />
      <CycleFilterSheet
        isOpen={openSheet === "cycle"}
        onOpenChange={(open) => !open && setOpenSheet(null)}
        value={cycleFilter}
        onValueChange={(range) => {
          setCycleFilter(range);
          setOpenSheet(null);
        }}
      />
      <DateFilterSheet
        isOpen={openSheet === "date"}
        onOpenChange={(open) => !open && setOpenSheet(null)}
        value={dateFilter}
        onValueChange={(preset) => {
          setDateFilter(preset);
          setOpenSheet(null);
        }}
      />
    </ScreenContainer>
  );
}
