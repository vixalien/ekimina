import {
  dummyGroup,
  dummyMembers,
  dummyContributions,
  dummyRotation,
} from "../data/dummy.js";
import type { NextKey, Screen, ScreenFn, USSDContext } from "../types.js";

// ── Helpers ────────────────────────────────────────────────────────────────

const con = (text: string) => `CON ${text}`;
const end = (text: string) => `END ${text}`;

const getMember = (ctx: USSDContext) =>
  dummyMembers.find((m) => m.id === ctx.params.memberId);

const providers: Record<string, string> = {
  mtn: "MTN MoMo",
  airtel: "Airtel Money",
};

// ── Terminal screens ───────────────────────────────────────────────────────

export const notRegisteredScreen: ScreenFn = () => ({
  response: end(
    `You are not registered
in any savings group.

Contact your group leader
to join e-Kimina.`,
  ),
});

export const exitScreen: ScreenFn = () => ({
  response: end(`Thank you for using e-Kimina.`),
});

// ── 1. Make Contribution ───────────────────────────────────────────────────

const paymentResultScreen: ScreenFn = (ctx) => {
  const member = getMember(ctx);
  return {
    response:
      ctx.params.confirmed === "1"
        ? end(
            `Payment Successful!
0.01 USDm contributed
for Round 4.

Reputation: ${member?.reputation} -> ${(member?.reputation ?? 0) + 5}
SMS confirmation sent.`,
          )
        : end("Payment cancelled."),
  };
};

const confirmPaymentScreen: ScreenFn = (ctx, key) => ({
  response: con(
    `Confirm Payment
0.01 USDm via ${providers[ctx.params.provider ?? ""]}
to Gasabo Farmers A
Round 4

1. Confirm
0. Cancel`,
  ),
  params: { confirmed: key ?? "" },
  next: new Map([
    ["1", paymentResultScreen],
    ["0", paymentResultScreen],
  ]),
});

const makeContributionMenu: ScreenFn = (_ctx, key) => ({
  response: con(
    `Make Contribution
Round 4 of 6
Amount due: 0.01 USDm
Due date: 15 Jul 2026

1. Pay with MTN MoMo
2. Pay with Airtel Money
0. Back`,
  ),
  params: {
    provider: key === "1" ? "mtn" : "airtel",
  },
  next: new Map([
    ["1", confirmPaymentScreen],
    ["2", confirmPaymentScreen],
    ["0", mainMenu],
  ]),
});

// ── 2. My Contributions ────────────────────────────────────────────────────

const myContributionsScreen: ScreenFn = (ctx) => {
  const member = getMember(ctx);
  const contributions = dummyContributions.filter(
    (ct) => ct.memberId === member?.id,
  );
  const lines = contributions
    .map((ct) => {
      const date = ct.paidAt ? ct.paidAt.slice(5) : "PENDING";
      return `Rnd ${ct.round}: ${ct.amount} USDm ${date} ${ct.status.toUpperCase()}`;
    })
    .join("\n");
  return {
    response: end(
      `My Contributions
Gasabo Farmers A

${lines}`,
    ),
  };
};

// ── 3. Group Info ──────────────────────────────────────────────────────────

const rotationScheduleScreen: ScreenFn = () => {
  const lines = dummyRotation
    .map((r) => {
      const status =
        r.status === "paid"
          ? "PAID"
          : r.status === "current"
            ? "CURRENT"
            : "PENDING";
      return `Rnd ${r.round}: ${r.name} - ${status}`;
    })
    .join("\n");
  return { response: end(`Rotation Schedule\n\n${lines}`) };
};

const currentRoundScreen: ScreenFn = () => ({
  response: end(
    `Round ${dummyGroup.currentRound} Status
Recipient: Niyonzima David
Due date: 15 Jul 2026
Pool so far: ${dummyGroup.poolSoFar} USDm

Paid: ${dummyGroup.paidCount}/${dummyGroup.totalMembers} members`,
  ),
});

const groupInfoMenu: ScreenFn = () => ({
  response: con(
    `Gasabo Farmers A
Members: 6 | Rounds: 6
Contribution: 0.01 USDm
Frequency: Monthly

1. Rotation Schedule
2. Current Round
0. Back`,
  ),
  next: new Map([
    ["1", rotationScheduleScreen],
    ["2", currentRoundScreen],
    ["0", mainMenu],
  ]),
});

// ── 4. My Reputation ──────────────────────────────────────────────────────

const reputationExplanationScreen: ScreenFn = () => ({
  response: end(
    `About Reputation
Score starts at 50/100.

+5 on-time payment
-5 late payment
-20 default

Higher score = priority
in future group rounds.`,
  ),
});

const myReputationMenu: ScreenFn = (ctx) => ({
  response: con(
    `My Reputation
Score: ${getMember(ctx)?.reputation ?? 0} / 100

1. What is reputation?
0. Back`,
  ),
  next: new Map([
    ["1", reputationExplanationScreen],
    ["0", mainMenu],
  ]),
});

// ── 5. My Balance ──────────────────────────────────────────────────────────

const myBalanceScreen: ScreenFn = (ctx) => {
  const member = getMember(ctx);
  const paid = dummyContributions.filter(
    (ct) => ct.memberId === member?.id && ct.status === "paid",
  ).length;
  const total = (paid * 0.01).toFixed(2);
  return {
    response: end(
      `My Balance
Total contributed: ${total} USDm
My payout round: ${member?.payoutRound}
Est. payout: 0.06 USDm
Payout date: Aug 2026`,
    ),
  };
};

// ── 6. Manage Group ────────────────────────────────────────────────────────

const memberListScreen: ScreenFn = () => {
  const lines = dummyMembers
    .map((m) => `${m.name.split(" ")[0]} - ${m.reputation}/100`)
    .join("\n");
  return { response: end(`Member List\nGasabo Farmers A\n\n${lines}`) };
};

// 6.4 Record default

const recordDefaultResultScreen: ScreenFn = (ctx) => ({
  response:
    ctx.params.confirmed === "1"
      ? end(
          `Default Recorded.
${ctx.params.defaultMember} - reputation -20.
Member notified via SMS.`,
        )
      : end("Cancelled."),
});

const recordDefaultConfirmScreen: ScreenFn = (_ctx, key) => ({
  params: { confirmed: key ?? "" },
  response: con(
    `Record Default
Member: ${_ctx.params.defaultMember}
Action: -20 reputation

1. Confirm
0. Cancel`,
  ),
  next: new Map([
    ["1", recordDefaultResultScreen],
    ["0", recordDefaultResultScreen],
  ]),
});

const recordDefaultMenu: ScreenFn = (_ctx, key) => ({
  params: {
    defaultMember: key === "1" ? "Mukamana Bob" : "Uwase Eve",
  },
  response: con(
    `Record Default
Round 4 - Pending members:

1. Mukamana Bob
2. Uwase Eve
0. Back`,
  ),
  next: new Map([
    ["1", recordDefaultConfirmScreen],
    ["2", recordDefaultConfirmScreen],
    ["0", manageGroupMenu],
  ]),
});

// 6.3 Release payout

const releasePayoutResultScreen: ScreenFn = (ctx) => ({
  response:
    ctx.params.confirmed === "1"
      ? end(
          `Payout Released!
0.06 USDm sent to
Niyonzima David.

Round 5 now active.`,
        )
      : end("Cancelled."),
});

const releasePayoutMenu: ScreenFn = (_ctx, key) => ({
  params: { confirmed: key ?? "" },
  response: con(
    `Release Payout
Round ${dummyGroup.currentRound}
Recipient: Niyonzima David
Pool: 0.06 USDm
Paid: ${dummyGroup.paidCount}/${dummyGroup.totalMembers}

1. Release Now
0. Cancel`,
  ),
  next: new Map([
    ["1", releasePayoutResultScreen],
    ["0", releasePayoutResultScreen],
  ]),
});

// 6.2 Set recipient

const setRecipientResultScreen: ScreenFn = (ctx) => ({
  response:
    ctx.params.confirmed === "1"
      ? end(
          `Recipient set!
${ctx.params.recipient} confirmed
for Round 4.`,
        )
      : end("Cancelled."),
});

const setRecipientConfirmScreen: ScreenFn = (ctx, key) => ({
  params: { confirmed: key ?? "" },
  response: con(
    `Confirm Recipient
Round 4 recipient:
${ctx.params.recipient}
Payout: 0.06 USDm

1. Confirm
0. Cancel`,
  ),
  next: new Map([
    ["1", setRecipientResultScreen],
    ["0", setRecipientResultScreen],
  ]),
});

const setRecipientMenu: ScreenFn = (_ctx, key) => {
  const idx = parseInt(key ?? "0") - 1;
  const selected = dummyMembers[idx];
  const lines = dummyMembers.map((m, i) => `${i + 1}. ${m.name}`).join("\n");
  const entries: [string, ScreenFn][] = dummyMembers.map((_, i) => [
    String(i + 1),
    setRecipientConfirmScreen,
  ]);
  entries.push(["0", manageGroupMenu]);
  return {
    params: { recipient: selected?.name ?? "" },
    response: con(
      `Set Recipient - Round 4
Select member:

${lines}
0. Back`,
    ),
    next: new Map(entries),
  };
};

// 6.1 Add member

const addMemberResultScreen: ScreenFn = (ctx) => ({
  response:
    ctx.params.confirmed === "1"
      ? end(
          `Member Added!
${ctx.params.newPhone} registered
in Gasabo Farmers A.

SMS sent to member.`,
        )
      : end("Cancelled."),
});

const addMemberConfirmScreen: ScreenFn = (_ctx, key) => ({
  params: { newPhone: key ?? "", confirmed: "" },
  response: con(
    `Add Member
Phone: ${key}
MTN MoMo: Verified

1. Confirm & Register
0. Cancel`,
  ),
  next: new Map([
    ["1", addMemberResultScreen],
    ["0", addMemberResultScreen],
  ]),
});

const addMemberMenu: ScreenFn = () => ({
  response: con(
    `Add Member
Enter member phone number:`,
  ),
  next: new Map([
    [/^\d{10}$/, addMemberConfirmScreen],
    ["0", manageGroupMenu],
  ] as [NextKey, ScreenFn][]),
});

// ── Manage group menu ──────────────────────────────────────────────────────

export function manageGroupMenu(ctx: USSDContext): Screen {
  if (ctx.params.isLeader !== "true") {
    return { response: end("Access denied.") };
  }
  return {
    response: con(
      `Manage Group
Gasabo Farmers A

1. Add Member
2. Set Round Recipient
3. Release Payout
4. Record Default
5. Member List
0. Back`,
    ),
    next: new Map([
      ["1", addMemberMenu],
      ["2", setRecipientMenu],
      ["3", releasePayoutMenu],
      ["4", recordDefaultMenu],
      ["5", memberListScreen],
      ["0", mainMenu],
    ]),
  };
}

// ── Main menu ──────────────────────────────────────────────────────────────

export function mainMenu(ctx: USSDContext): Screen {
  const leaderOption =
    ctx.params.isLeader === "true" ? "\n6. Manage Group" : "";
  return {
    response: con(
      `e-Kimina
Gasabo Farmers A | Round 4

1. Make Contribution
2. My Contributions
3. Group Info
4. My Reputation
5. My Balance${leaderOption}
0. Exit`,
    ),
    next: new Map([
      ["1", makeContributionMenu],
      ["2", myContributionsScreen],
      ["3", groupInfoMenu],
      ["4", myReputationMenu],
      ["5", myBalanceScreen],
      ...(ctx.params.isLeader === "true"
        ? [["6", manageGroupMenu] as [string, ScreenFn]]
        : []),
      ["0", exitScreen],
    ]),
  };
}

// ── Entry ──────────────────────────────────────────────────────────────────

export const entryMenu: ScreenFn = (ctx) => {
  const member = dummyMembers.find((m) => m.phone === ctx.phone);
  const destination = member ? mainMenu : notRegisteredScreen;
  return {
    response: con(
      `Murakaza neza kuri e-Kimina
Welcome to e-Kimina

1. English
2. Kinyarwanda
3. Français`,
    ),
    params: {
      memberId: member?.id ?? "",
      isLeader: member?.role === "leader" ? "true" : "false",
    },
    next: new Map([[/^[123]$/, destination]]),
  };
};
