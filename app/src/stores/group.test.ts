import { describe, expect, it, beforeEach } from "vitest";

import { $group, applyTemplate, resetGroup, updateSettings } from "./group";

describe("group creation store", () => {
  beforeEach(() => resetGroup());

  it("starts with no template and empty settings", () => {
    const state = $group.get();
    expect(state.templateId).toBeNull();
    expect(state.settings).toEqual({});
  });

  it("applyTemplate sets template", () => {
    applyTemplate("student");
    expect($group.get().templateId).toBe("student");
  });

  it("updateSettings merges partial settings", () => {
    updateSettings({ contributionAmount: 5000 });
    expect($group.get().settings.contributionAmount).toBe(5000);

    updateSettings({ cycleLength: 7 });
    expect($group.get().settings.contributionAmount).toBe(5000);
    expect($group.get().settings.cycleLength).toBe(7);
  });

  it("resetGroup clears everything", () => {
    applyTemplate("farmers");
    updateSettings({ contributionAmount: 10000 });
    resetGroup();
    expect($group.get().templateId).toBeNull();
    expect($group.get().settings).toEqual({});
  });
});
