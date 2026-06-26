import type { JSX } from "react";
import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import {
  Description,
  InputGroup,
  Label,
  Radio,
  RadioGroup,
  Separator,
  Surface,
  TextField,
  useToast,
} from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { api } from "../../api";
import type { PublicGroup } from "../../api";
import { nav } from "../../lib/routes";
import { AppText } from "../../components/ui/app-text";
import { OnboardingLayout } from "../../components/ui/onboarding-layout";

const StyledIonicons = withUniwind(Ionicons);

export default function SearchGroupsScreen(): JSX.Element {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  const search = useCallback(async (text: string) => {
    setIsLoading(true);
    try {
      const results = await api.groups.searchPublicGroups(text);
      setGroups(results);
    } catch (error) {
      console.error(error);
      setGroups([]);
      toast.show({
        variant: "danger",
        label: "Search failed",
        description: "Could not load groups. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.groups.searchPublicGroups("").then((results) => {
      if (!cancelled) {
        setGroups(results);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleQueryChange(text: string) {
    setQuery(text);
    setSelectedId(null);
    search(text);
  }

  async function handleContinue() {
    if (!selectedId || isJoining) return;
    setIsJoining(true);
    try {
      const request = await api.groups.requestToJoinGroup("user-new", selectedId);
      nav.onboarding.toPending({
        requestId: request.id,
        groupName: request.groupName,
        requestedAt: request.requestedAt,
      });
    } catch (error) {
      console.error(error);
      toast.show({
        variant: "danger",
        label: "Could not send request",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <OnboardingLayout
      title="Browse groups"
      description="Find an ikimina to join"
      buttonLabel={isJoining ? "Sending request..." : "Request to join"}
      isLoading={isJoining}
      isDisabled={!selectedId}
      onButtonPress={handleContinue}
    >
      <TextField>
        <InputGroup>
          <InputGroup.Prefix isDecorative>
            <StyledIonicons name="search-outline" size={16} className="text-muted" />
          </InputGroup.Prefix>
          <InputGroup.Input
            placeholder="Search by name..."
            value={query}
            onChangeText={handleQueryChange}
            autoCorrect={false}
          />
        </InputGroup>
      </TextField>

      <View className="mt-4">
        <Surface>
          <RadioGroup value={selectedId ?? ""} onValueChange={setSelectedId}>
            {groups.map((group, index) => (
              <React.Fragment key={group.id}>
                {index > 0 && <Separator className="mx-4" />}
                <RadioGroup.Item value={group.id}>
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="size-10 rounded-full bg-accent/10 items-center justify-center">
                      <AppText className="text-sm font-bold text-accent">
                        {group.avatarInitials}
                      </AppText>
                    </View>
                    <View className="flex-1">
                      <Label>{group.name}</Label>
                      <Description>{group.memberCount} members</Description>
                    </View>
                  </View>
                  <Radio />
                </RadioGroup.Item>
              </React.Fragment>
            ))}
          </RadioGroup>
        </Surface>
      </View>

      {isLoading && <AppText className="text-xs text-center text-muted mt-4">Loading...</AppText>}

      {!isLoading && groups.length === 0 && (
        <View className="items-center gap-2 mt-8">
          <AppText className="text-muted">No groups found for &quot;{query}&quot;</AppText>
        </View>
      )}
    </OnboardingLayout>
  );
}
