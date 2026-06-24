import type { JSX } from "react";
import { useCallback, useState } from "react";
import { View, FlatList, Pressable } from "react-native";
import {
  Button,
  Card,
  InputGroup,
  Label,
  TextField,
} from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { api } from "../../api";
import type { PublicGroup } from "../../api";
import { nav } from "../../lib/nav";
import { AppText } from "../../components/ui/app-text";
import { ScreenContainer } from "../../components/ui/screen-container";

const StyledIonicons = withUniwind(Ionicons);

function GroupCard({
  group,
  onPress,
}: {
  group: PublicGroup;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card className="mb-3">
        <View className="flex-row items-center gap-4 p-1">
          <View className="size-12 rounded-full bg-accent/10 items-center justify-center">
            <AppText className="text-base font-bold text-accent">
              {group.avatarInitials}
            </AppText>
          </View>
          <View className="flex-1 gap-0.5">
            <AppText className="text-base font-semibold text-foreground">
              {group.name}
            </AppText>
            <AppText className="text-xs text-muted" numberOfLines={1}>
              {group.description}
            </AppText>
            <View className="flex-row items-center gap-1 mt-0.5">
              <StyledIonicons
                name="people-outline"
                size={12}
                className="text-muted"
              />
              <AppText className="text-xs text-muted">
                {group.memberCount} members
              </AppText>
            </View>
          </View>
          <StyledIonicons
            name="chevron-forward"
            size={18}
            className="text-muted"
          />
        </View>
      </Card>
    </Pressable>
  );
}

export default function SearchGroupsScreen(): JSX.Element {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicGroup[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PublicGroup | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const groups = await api.groups.searchPublicGroups(text);
      setResults(groups);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  async function handleRequestJoin() {
    if (!selectedGroup || isJoining) return;
    setIsJoining(true);
    try {
      const request = await api.groups.requestToJoinGroup(
        "user-new",
        selectedGroup.id,
      );
      nav.replace("/(onboarding)/pending", {
        requestId: request.id,
        groupName: request.groupName,
        requestedAt: request.requestedAt,
      });
    } catch {
      // error handling
    } finally {
      setIsJoining(false);
    }
  }

  // Group detail view
  if (selectedGroup) {
    return (
      <ScreenContainer extraTop={12}>
        <View className="flex-1 px-6 gap-8">
          {/* Back button */}
          <Pressable
            onPress={() => setSelectedGroup(null)}
            className="absolute top-0 left-0 p-2"
          >
            <StyledIonicons
              name="arrow-back"
              size={22}
              className="text-foreground"
            />
          </Pressable>

          {/* Group info at top */}
          <View className="items-center gap-4 mt-4">
            <View className="size-20 rounded-full bg-accent/10 items-center justify-center">
              <AppText className="text-2xl font-bold text-accent">
                {selectedGroup.avatarInitials}
              </AppText>
            </View>
            <View className="items-center gap-1">
              <AppText className="text-xl font-semibold text-foreground">
                {selectedGroup.name}
              </AppText>
              <AppText className="text-sm text-muted text-center">
                {selectedGroup.description}
              </AppText>
              <View className="flex-row items-center gap-1 mt-1">
                <StyledIonicons
                  name="people-outline"
                  size={14}
                  className="text-foreground"
                />
                <AppText className="text-sm text-foreground">
                  {selectedGroup.memberCount} members
                </AppText>
              </View>
            </View>
          </View>

          {/* Spacer */}
          <View className="flex-1" />

          {/* Button at bottom */}
          <Button
            variant="primary"
            isDisabled={isJoining}
            onPress={handleRequestJoin}
          >
            <Button.Label>
              {isJoining ? "Sending request..." : "Request to join"}
            </Button.Label>
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  // Search view
  return (
    <ScreenContainer extraTop={12}>
      <View className="flex-1 px-6 gap-4">
        {/* Back button */}
        <Pressable
          onPress={() => nav.replace("/(onboarding)/join-or-create")}
          className="absolute top-0 left-0 p-2"
        >
          <StyledIonicons
            name="arrow-back"
            size={22}
            className="text-foreground"
          />
        </Pressable>

        {/* Header at top */}
        <View className="gap-2 mt-8">
          <AppText className="text-2xl font-semibold text-foreground">
            Search public groups
          </AppText>
          <AppText className="text-sm text-muted">
            Find an ikimina to join
          </AppText>
        </View>

        {/* Search input */}
        <TextField>
          <Label>Search</Label>
          <InputGroup>
            <InputGroup.Prefix isDecorative>
              <StyledIonicons
                name="search-outline"
                size={16}
                className="text-muted"
              />
            </InputGroup.Prefix>
            <InputGroup.Input
              placeholder="Search by name..."
              value={query}
              onChangeText={handleSearch}
              autoCorrect={false}
            />
          </InputGroup>
        </TextField>

        {isSearching && (
          <AppText className="text-xs text-center text-muted">
            Searching...
          </AppText>
        )}

        {/* Results list */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GroupCard group={item} onPress={() => setSelectedGroup(item)} />
          )}
          ListEmptyComponent={
            query.length >= 2 && !isSearching ? (
              <View className="items-center gap-2 mt-8">
                <StyledIonicons
                  name="search-outline"
                  size={32}
                  className="text-foreground"
                />
                <AppText className="text-muted">
                  No groups found for &quot;{query}&quot;
                </AppText>
              </View>
            ) : null
          }
        />
      </View>
    </ScreenContainer>
  );
}
