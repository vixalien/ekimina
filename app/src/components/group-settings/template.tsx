import type { JSX } from "react";
import { View } from "react-native";
import { Description, Label, Radio, RadioGroup, Separator, Surface } from "heroui-native";
import { GROUP_TEMPLATES } from "../../constants/group-templates";
import type { TemplateId } from "../../stores/group";

interface TemplateSelectorProps {
  selectedId: TemplateId | null;
  onSelect: (id: TemplateId) => void;
}

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps): JSX.Element {
  return (
    <Surface>
      <RadioGroup value={selectedId ?? ""} onValueChange={(v) => onSelect(v as TemplateId)}>
        {GROUP_TEMPLATES.map((template, index) => (
          <View key={template.id}>
            {index > 0 && <Separator className="my-1" />}
            <RadioGroup.Item value={template.id}>
              <View className="flex-1">
                <Label>{template.title}</Label>
                <Description>{template.description}</Description>
              </View>
              <Radio />
            </RadioGroup.Item>
          </View>
        ))}
      </RadioGroup>
    </Surface>
  );
}
