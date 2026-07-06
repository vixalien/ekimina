import type { MemberListItem } from "@/api";

import { Ionicons } from "@expo/vector-icons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import {
  Avatar,
  BottomSheet,
  Button,
  Input,
  ListGroup,
  PressableFeedback,
  ScrollShadow,
  Separator,
  TextField,
  useBottomSheetAwareHandlers,
  useThemeColor,
} from "heroui-native";
import { Fragment, type JSX, useMemo, useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

function SearchInput({
  query,
  onChangeText,
}: {
  query: string;
  onChangeText: (t: string) => void;
}) {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <TextField className="absolute top-0 left-0 right-0 px-5 pt-2">
      <View className="w-full flex-row items-center">
        <Input
          variant="secondary"
          placeholder="Search members..."
          value={query}
          onChangeText={onChangeText}
          className="flex-1 px-10"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <View className="absolute left-3.5" pointerEvents="none">
          <StyledIonicons name="search-outline" size={16} className="text-muted" />
        </View>
        {query.length > 0 && (
          <Pressable className="absolute right-3 p-1" onPress={() => onChangeText("")} hitSlop={12}>
            <StyledIonicons name="close-circle" size={20} className="text-muted" />
          </Pressable>
        )}
      </View>
    </TextField>
  );
}

interface MemberFilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  members: MemberListItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function MemberFilterSheet({
  isOpen,
  onOpenChange,
  members,
  selectedIds,
  onSelectionChange,
}: MemberFilterSheetProps): JSX.Element {
  const [query, setQuery] = useState("");
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);
  const themeColorOverlay = useThemeColor("overlay");

  const snapPoints = useMemo(() => ["50%", "90%"], []);

  const filtered = useMemo(() => {
    if (!query.trim()) return members;
    const lower = query.toLowerCase();
    return members.filter((m) => m.name.toLowerCase().includes(lower));
  }, [members, query]);

  function toggleMember(userId: string) {
    setLocalSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  function handleApply() {
    Keyboard.dismiss();
    onSelectionChange(localSelected);
    onOpenChange(false);
  }

  function handleReset() {
    Keyboard.dismiss();
    setLocalSelected([]);
    onSelectionChange([]);
    onOpenChange(false);
  }

  function handleOpenChange(open: boolean) {
    if (open) setLocalSelected(selectedIds);
    onOpenChange(open);
  }

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={handleOpenChange}>
      <BottomSheet.Trigger asChild>
        <View />
      </BottomSheet.Trigger>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          snapPoints={snapPoints}
          enableOverDrag={false}
          enableDynamicSizing={false}
          contentContainerClassName="h-full pt-16 pb-2"
          keyboardBehavior="extend"
        >
          <SearchInput query={query} onChangeText={setQuery} />
          <ScrollShadow LinearGradientComponent={LinearGradient} color={themeColorOverlay}>
            <BottomSheetScrollView
              showsVerticalScrollIndicator={false}
              contentContainerClassName="pt-3"
              keyboardShouldPersistTaps="handled"
            >
              <ListGroup>
                {filtered.map((member, index) => {
                  const isSelected = localSelected.includes(member.userId);
                  return (
                    <Fragment key={member.userId}>
                      {index > 0 && <Separator className="mx-4" />}
                      <PressableFeedback
                        animation={false}
                        onPress={() => toggleMember(member.userId)}
                      >
                        <PressableFeedback.Scale>
                          <ListGroup.Item>
                            <ListGroup.ItemPrefix>
                              <Avatar size="sm" color="accent">
                                <Avatar.Fallback>{member.initials}</Avatar.Fallback>
                              </Avatar>
                            </ListGroup.ItemPrefix>
                            <ListGroup.ItemContent>
                              <ListGroup.ItemTitle>{member.name}</ListGroup.ItemTitle>
                            </ListGroup.ItemContent>
                            <ListGroup.ItemSuffix>
                              {isSelected && (
                                <StyledIonicons
                                  name="checkmark-circle"
                                  size={20}
                                  className="text-accent"
                                />
                              )}
                            </ListGroup.ItemSuffix>
                          </ListGroup.Item>
                        </PressableFeedback.Scale>
                        <PressableFeedback.Ripple />
                      </PressableFeedback>
                    </Fragment>
                  );
                })}
              </ListGroup>
            </BottomSheetScrollView>
          </ScrollShadow>
          <View className="px-5 pt-2 gap-2">
            <Button variant="primary" onPress={handleApply}>
              <Button.Label>
                {localSelected.length > 0 ? `Apply (${localSelected.length} selected)` : "Apply"}
              </Button.Label>
            </Button>
            <Button variant="ghost" onPress={handleReset} isDisabled={localSelected.length === 0}>
              <Button.Label>Clear</Button.Label>
            </Button>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
