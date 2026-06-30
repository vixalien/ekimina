import { Ionicons } from "@expo/vector-icons";
import { Avatar, Chip, ListGroup, Separator } from "heroui-native";
import type { LoanSignature } from "../../api/types";
import type { JSX } from "react";
import { Fragment } from "react";
import { View } from "react-native";
import { withUniwind } from "uniwind";
import { AppText } from "../ui/app-text";

const StyledIonicons = withUniwind(Ionicons);

interface LoanSignatureListProps {
  signatures: LoanSignature[];
}

export function LoanSignatureList({ signatures }: LoanSignatureListProps): JSX.Element {
  return (
    <ListGroup>
      {signatures.map((sig, index) => (
        <Fragment key={sig.userId}>
          {index > 0 && <Separator className="mx-4" />}
          <ListGroup.Item disabled>
            <ListGroup.ItemPrefix>
              {sig.signed ? (
                <View className="relative">
                  <Avatar size="sm" color="success">
                    <Avatar.Fallback>{sig.initials}</Avatar.Fallback>
                  </Avatar>
                  <View className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-success items-center justify-center">
                    <StyledIonicons name="checkmark" size={10} className="text-white" />
                  </View>
                </View>
              ) : (
                <View className="size-8 rounded-full border-2 border-dashed border-border items-center justify-center">
                  <AppText className="text-xs text-muted">{sig.initials}</AppText>
                </View>
              )}
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{sig.name}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription className="text-muted">
                {sig.role}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              {sig.signed ? (
                <Chip variant="soft" color="success" size="sm">
                  <Chip.Label>Signed</Chip.Label>
                </Chip>
              ) : (
                <Chip variant="soft" size="sm">
                  <Chip.Label>Pending</Chip.Label>
                </Chip>
              )}
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </Fragment>
      ))}
    </ListGroup>
  );
}
