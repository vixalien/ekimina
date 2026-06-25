import { map } from "nanostores";
import type { GroupSettings } from "../api/types";
import { GROUP_TEMPLATES } from "../constants/group-templates";

export type TemplateId = "student" | "vacation" | "farmers" | "employee" | "scratch";

export interface GroupState {
  templateId: TemplateId | null;
  settings: Partial<GroupSettings>;
}

export const $group = map<GroupState>({
  templateId: null,
  settings: {},
});

export function applyTemplate(id: TemplateId): void {
  const template = GROUP_TEMPLATES.find((t) => t.id === id);
  $group.setKey("templateId", id);
  $group.setKey("settings", { ...(template?.defaults ?? {}) });
}

export function updateSettings(partial: Partial<GroupSettings>): void {
  const current = $group.get().settings;
  $group.setKey("settings", { ...current, ...partial });
}

export function resetGroup(): void {
  $group.set({ templateId: null, settings: {} });
}
