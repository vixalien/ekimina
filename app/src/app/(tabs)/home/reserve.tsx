import type { ReserveCycleSummary, ReserveDetail } from "@/api";

import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ListGroup, PressableFeedback, ScrollShadow, Separator, Surface } from "heroui-native";
import { Fragment, type JSX } from "react";
import { startTransition, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { withUniwind } from "uniwind";

import { dataClient } from "@/api";
import { AppText } from "@/components/ui/app-text";
import { Header } from "@/components/ui/header";
import { LineChart } from "@/components/ui/line-chart";
import { ScreenContainer } from "@/components/ui/screen-container";
import { Routes } from "@/lib/routes";
import { formatRWF } from "@/lib/strings";
import { $activeGroup } from "@/stores/active-group";

const StyledIonicons = withUniwind(Ionicons);

type Horizon = "6" | "12";

interface BreakdownRow {
  label: string;
  amount: number;
  colorClass: string;
  type: string;
  prefix: string;
}

function buildRows(summary: ReserveCycleSummary, _currentCycle: number): BreakdownRow[] {
  const rows: BreakdownRow[] = [
    {
      label: "Contributions in",
      amount: summary.contributionsIn,
      colorClass: "text-success",
      type: "contribution",
      prefix: "+",
    },
    {
      label: "Payout out",
      amount: summary.payoutOut,
      colorClass: "text-danger",
      type: "payout",
      prefix: "-",
    },
    {
      label: "Penalties absorbed",
      amount: summary.penaltiesAbsorbed,
      colorClass: "text-success",
      type: "penalty",
      prefix: "+",
    },
    {
      label: "Loan interest in",
      amount: summary.loanInterestIn,
      colorClass: "text-success",
      type: "loan_repayment",
      prefix: "+",
    },
  ];

  if (summary.loanDisbursed != null) {
    rows.push({
      label: "Loan disbursed",
      amount: summary.loanDisbursed,
      colorClass: "text-danger",
      type: "loan_disbursement",
      prefix: "-",
    });
  }
  if (summary.discretionaryDeposits != null) {
    rows.push({
      label: "Discretionary deposits",
      amount: summary.discretionaryDeposits,
      colorClass: "text-success",
      type: "discretionary_deposit",
      prefix: "+",
    });
  }
  if (summary.discretionaryWithdrawals != null) {
    rows.push({
      label: "Discretionary withdrawals",
      amount: summary.discretionaryWithdrawals,
      colorClass: "text-foreground",
      type: "discretionary_withdrawal",
      prefix: "-",
    });
  }

  return rows;
}

const TABS = ["6", "12"] as const;

function handleRowPress(type: string) {
  router.push({
    pathname: Routes.activity.transactions,
    params: { type },
  });
}

export default function ReserveDetailScreen(): JSX.Element {
  const { activeGroupId } = useStore($activeGroup);
  const [data, setData] = useState<ReserveDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState<Horizon>("6");

  useEffect(() => {
    if (!activeGroupId) return;
    startTransition(() => setLoading(true));
    dataClient.groups
      .getReserveDetail(activeGroupId)
      .then((d: any) =>
        startTransition(() => {
          setData(d);
          setLoading(false);
        }),
      )
      .catch(() => startTransition(() => setLoading(false)));
  }, [activeGroupId]);

  if (loading || !data) {
    return (
      <ScreenContainer className="items-center justify-center">
        <AppText className="text-muted text-base">Loading...</AppText>
      </ScreenContainer>
    );
  }

  const projection = horizon === "6" ? data.projection6 : data.projection12;
  const rows = buildRows(data.cycleSummary, data.history.length);

  return (
    <ScreenContainer>
      <Header title="Reserve detail" canGoBack />
      <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-36">
          <View className="px-4 pt-4 gap-6">
            {/* Header */}
            <View className="gap-1">
              <AppText className="text-xs text-muted uppercase tracking-wider">
                Group reserve
              </AppText>
              <AppText className="text-4xl font-hero text-foreground">
                {formatRWF(data.balance)}
              </AppText>
            </View>

            {/* Horizon selector */}
            <View className="flex-row bg-surface-secondary rounded-xl p-1">
              {TABS.map((tab) => {
                const isActive = horizon === tab;
                return (
                  <PressableFeedback key={tab} animation={false} onPress={() => setHorizon(tab)}>
                    <View
                      className={`flex-1 py-2 rounded-lg items-center ${isActive ? "bg-accent" : ""}`}
                    >
                      <AppText
                        className={`text-sm font-medium ${isActive ? "text-accent-foreground" : "text-muted"}`}
                      >
                        {tab} cycles
                      </AppText>
                    </View>
                  </PressableFeedback>
                );
              })}
            </View>

            {/* Chart */}
            <LineChart
              history={data.history.map((d: any) => d.balance)}
              projection={projection.map((d: any) => d.balance)}
            />

            {/* Breakdown */}
            <AppText className="text-xs text-muted uppercase tracking-wider ml-2">
              This cycle
            </AppText>

            <ListGroup>
              {rows.map((row, index) => (
                <Fragment key={row.label}>
                  {index > 0 && <Separator className="mx-4" />}
                  <PressableFeedback animation={false} onPress={() => handleRowPress(row.type)}>
                    <PressableFeedback.Scale>
                      <ListGroup.Item>
                        <ListGroup.ItemContent>
                          <ListGroup.ItemTitle>{row.label}</ListGroup.ItemTitle>
                        </ListGroup.ItemContent>
                        <AppText className={`text-sm font-medium ${row.colorClass}`}>
                          {row.prefix}
                          {formatRWF(row.amount)}
                        </AppText>
                        <ListGroup.ItemSuffix />
                      </ListGroup.Item>
                    </PressableFeedback.Scale>
                    <PressableFeedback.Ripple />
                  </PressableFeedback>
                </Fragment>
              ))}
            </ListGroup>

            {/* Insight */}
            {data.insight && (
              <Surface variant="secondary" className="px-4 py-3 rounded-xl">
                <View className="flex-row items-start gap-2">
                  <StyledIonicons
                    name="information-circle-outline"
                    size={18}
                    className="text-muted mt-0.5"
                  />
                  <AppText className="text-sm text-muted flex-1">{data.insight}</AppText>
                </View>
              </Surface>
            )}
          </View>
        </ScrollView>
      </ScrollShadow>
    </ScreenContainer>
  );
}
