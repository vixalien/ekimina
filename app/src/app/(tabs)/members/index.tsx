import { Ionicons } from "@expo/vector-icons";
import {
  Button,
  cn,
  InputGroup,
  ListGroup,
  PressableFeedback,
  ScrollShadow,
  Separator,
  Spinner,
} from "heroui-native";
import { useStore } from "@nanostores/react";
import { router } from "expo-router";
import { Fragment, type JSX } from "react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { withUniwind } from "uniwind";

import { dataClient } from "@/api";
import type { MemberListItem } from "@/api";
import { AppText } from "@/components/ui/app-text";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import { nav } from "@/lib/routes";
import { FilterBottomSheet, type FilterKey } from "@/components/members/filter-bottom-sheet";
import { $activeGroup } from "@/stores/active-group";
import { LinearGradient } from "expo-linear-gradient";

const StyledIonicons = withUniwind(Ionicons);

function sortMembers(members: MemberListItem[]): MemberListItem[] {
  const weight: Record<string, number> = {
    missed_penalised: 0,
    pending_late: 1,
    no_status: 2,
    paid: 3,
  };
  return [...members].sort((a, b) => (weight[a.status] ?? 9) - (weight[b.status] ?? 9));
}

export default function MembersTab(): JSX.Element {
  const activeGroup = useStore($activeGroup);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [isSearching, setIsSearching] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const groupId = activeGroup.activeGroupId;

  useEffect(() => {
    if (!groupId) return;
    startTransition(() => setLoading(true));
    dataClient.groups
      .getGroupMembers(groupId)
      .then(setMembers)
      .catch(() => {})
      .finally(() => startTransition(() => setLoading(false)));
  }, [groupId]);

  function handleSearch(text: string) {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!groupId) return;
      setIsSearching(true);
      const promise = !text.trim()
        ? dataClient.groups.getGroupMembers(groupId)
        : dataClient.groups.searchMembers(groupId, text.trim());
      promise
        .then(setMembers)
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }, 300);
  }

  const sorted = useMemo(() => {
    let list = members;
    if (activeFilter === "unpaid") {
      list = list.filter((m) => m.status !== "paid");
    } else if (activeFilter === "has_loan") {
      list = list.filter((m) => m.activeLoanAmount !== null);
    } else if (activeFilter === "penalty") {
      list = list.filter((m) => m.penaltyCount > 0);
    }
    return sortMembers(list);
  }, [members, activeFilter]);

  function handleMemberPress(userId: string) {
    router.push({
      pathname: "/(tabs)/members/[userId]",
      params: { userId },
    });
  }

  const isFiltered = activeFilter !== "all";

  return (
    <ScreenContainer>
      <Header
        title="Members"
        canGoBack={false}
        options={
          <Pressable onPress={() => nav.members.toInvite()} hitSlop={8}>
            <StyledIonicons name="person-add-outline" size={22} className="text-foreground" />
          </Pressable>
        }
      />

      <View className="px-4 pt-2 pb-3 gap-3">
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <InputGroup>
              <InputGroup.Prefix isDecorative>
                {isSearching ? (
                  <Spinner size="sm" color="default" />
                ) : (
                  <StyledIonicons name="search-outline" size={16} className="text-muted" />
                )}
              </InputGroup.Prefix>
              <InputGroup.Input
                placeholder="Search members..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <InputGroup.Suffix>
                  <Pressable onPress={() => handleSearch("")} hitSlop={12}>
                    <StyledIonicons name="close-circle" size={18} className="text-muted" />
                  </Pressable>
                </InputGroup.Suffix>
              )}
            </InputGroup>
          </View>

          <Button
            onPress={() => setIsFilterOpen(true)}
            variant="ghost"
            className={cn("shadow rounded-2xl bg-surface")}
          >
            <StyledIonicons
              name={isFiltered ? "funnel" : "funnel-outline"}
              size={18}
              className={isFiltered ? "text-blue-600" : "text-muted"}
            />
          </Button>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <AppText className="text-muted text-base">Loading...</AppText>
        </View>
      ) : (
        <ScrollShadow LinearGradientComponent={LinearGradient}>
          <ScrollView
            className="px-4"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-30"
          >
            {sorted.length > 0 ? (
              <ListGroup>
                {sorted.map((member, index) => (
                  <Fragment key={member.userId}>
                    {index > 0 && <Separator className="mx-4" />}
                    <PressableFeedback
                      animation={false}
                      onPress={() => handleMemberPress(member.userId)}
                    >
                      <PressableFeedback.Scale>
                        <ListGroup.Item>
                          <ListGroup.ItemPrefix>
                            <View className="size-10 rounded-full bg-accent/10 items-center justify-center">
                              <AppText className="text-sm font-semibold text-accent">
                                {member.initials}
                              </AppText>
                            </View>
                          </ListGroup.ItemPrefix>
                          <ListGroup.ItemContent>
                            <ListGroup.ItemTitle>{member.name}</ListGroup.ItemTitle>
                            <ListGroup.ItemDescription>
                              rep {member.reputation}
                            </ListGroup.ItemDescription>
                          </ListGroup.ItemContent>
                          <ListGroup.ItemSuffix />
                        </ListGroup.Item>
                      </PressableFeedback.Scale>
                      <PressableFeedback.Ripple />
                    </PressableFeedback>
                  </Fragment>
                ))}
              </ListGroup>
            ) : (
              <View className="items-center py-12">
                <StyledIonicons name="people-outline" size={48} className="text-muted mb-3" />
                <AppText className="text-base text-muted">No members found</AppText>
                <AppText className="text-sm text-muted mt-1">
                  {searchQuery ? "Try a different name" : "No members match this filter"}
                </AppText>
              </View>
            )}
          </ScrollView>
        </ScrollShadow>
      )}

      <FilterBottomSheet
        isOpen={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
      />
    </ScreenContainer>
  );
}
