import { Ionicons } from "@expo/vector-icons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  Avatar,
  BottomSheet,
  Button,
  InputGroup,
  ListGroup,
  PressableFeedback,
  Separator,
  useBottomSheetAwareHandlers,
} from "heroui-native";
import { Fragment, type JSX, useState } from "react";
import { Keyboard, View } from "react-native";
import { withUniwind } from "uniwind";
import type { MemberListItem } from "../../api/types";

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
    <InputGroup>
      <InputGroup.Prefix isDecorative>
        <StyledIonicons name="search-outline" size={16} className="text-muted" />
      </InputGroup.Prefix>
      <InputGroup.Input
        placeholder="Search members..."
        value={query}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {query.length > 0 && (
        <InputGroup.Suffix>
          <PressableFeedback onPress={() => onChangeText("")} hitSlop={12}>
            <StyledIonicons name="close-circle" size={18} className="text-muted" />
          </PressableFeedback>
        </InputGroup.Suffix>
      )}
    </InputGroup>
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

  const filtered = query.trim()
    ? members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
    : members;

  function toggleMember(userId: string) {
    setLocalSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
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
        <BottomSheet.Content contentContainerClassName="pb-4" keyboardBehavior="extend">
          <View className="px-2 pt-2 mb-3">
            <BottomSheet.Title>Filter by member</BottomSheet.Title>
          </View>
          <View className="mb-3">
            <SearchInput query={query} onChangeText={setQuery} />
          </View>
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
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
          <View className="mt-4 gap-2">
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
