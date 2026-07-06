import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface DeployedState {
  accounts: Record<string, string>; // address_lowercase → display name
  groups: Record<string, { name: string; inviteCode: string }>;
}

const statePath = path.join(__dirname, "deployed-state.json");

let state: DeployedState = { accounts: {}, groups: {} };

try {
  state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
} catch {
  console.warn("[deployed-state] no deployed-state.json found at", statePath);
}

export const ACCOUNT_NAMES: Record<string, string> = state.accounts;
export const GROUP_META: Record<string, { name: string; inviteCode: string }> = state.groups;
