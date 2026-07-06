import { router } from "expo-router";

export const Routes = {
  welcome: "/welcome" as const,
  tabs: "/(tabs)/home" as const,

  home: {
    reserve: "/(tabs)/home/reserve" as const,
  },

  onboarding: {
    phone: "/(onboarding)/phone" as const,
    verify: "/(onboarding)/verify" as const,
    joinOrCreate: "/(onboarding)/join-or-create" as const,
    inviteCode: "/(onboarding)/invite-code" as const,
    searchGroups: "/(onboarding)/search-groups" as const,
    pending: "/(onboarding)/pending" as const,

    signup: {
      name: "/(onboarding)/signup/name" as const,
      wallet: "/(onboarding)/signup/wallet" as const,
    },

    createGroup: {
      step: (n: 1 | 2 | 3 | 4 | 5 | 6) => `/(onboarding)/create-group/step-${n}` as const,
      success: "/(onboarding)/create-group/success" as const,
    },
  },

  activity: {
    transactions: "/(tabs)/activity/transactions" as const,
    detail: "/(tabs)/activity/[transactionId]" as const,
    discretionaryRequest: "/(tabs)/activity/discretionary-request" as const,
    discretionaryReview: "/(tabs)/activity/discretionary-review/[requestId]" as const,
    joinReview: "/(tabs)/activity/join-review/[requestId]" as const,
    withdrawalReview: "/(tabs)/activity/withdrawal-review/[requestId]" as const,
    loanDetail: "/(tabs)/activity/loan/[loanId]" as const,
    loanReview: "/(tabs)/activity/loan-review/[loanId]" as const,
  },

  profile: {
    groupSettings: "/(tabs)/profile/group-settings" as const,
    committee: "/(tabs)/profile/committee" as const,
    settingsReview: "/(tabs)/profile/settings-review" as const,
    leaveGroupConfirm: "/(tabs)/profile/leave-confirm" as const,
    leaveGroupPin: "/(tabs)/profile/leave-pin" as const,
    leaveGroupSent: "/(tabs)/profile/leave-sent" as const,
  },

  members: {
    invite: "/(tabs)/members/invite" as const,
  },
} as const;

export const nav = {
  toWelcome: () => router.replace(Routes.welcome),
  toTabs: () => router.replace(Routes.tabs),
  back: () => router.back(),
  home: {
    toReserve: () => router.push(Routes.home.reserve),
  },

  onboarding: {
    toPhone: () => router.push(Routes.onboarding.phone),
    toVerify: (phone: string) =>
      router.push({ pathname: Routes.onboarding.verify, params: { phone } }),
    toJoinOrCreate: () => router.replace(Routes.onboarding.joinOrCreate),
    toInviteCode: () => router.push(Routes.onboarding.inviteCode),
    toSearchGroups: () => router.push(Routes.onboarding.searchGroups),
    toPending: (params?: { requestId?: string; groupName?: string; requestedAt?: string }) =>
      router.replace({ pathname: Routes.onboarding.pending, params: params ?? {} }),

    signup: {
      toName: () => router.push(Routes.onboarding.signup.name),
      toWallet: () => router.push(Routes.onboarding.signup.wallet),
    },

    createGroup: {
      toStep: (n: 1 | 2 | 3 | 4 | 5 | 6 = 1) =>
        router.push(Routes.onboarding.createGroup.step(n)),
      toSuccess: () => router.replace(Routes.onboarding.createGroup.success),
    },
  },

  activity: {
    toTransactions: () => router.push(Routes.activity.transactions),
    toDetail: (id: string) =>
      router.push({ pathname: Routes.activity.detail, params: { transactionId: id } }),
    toDiscretionaryRequest: () => router.push(Routes.activity.discretionaryRequest),
    toDiscretionaryReview: (requestId: string) =>
      router.push({ pathname: Routes.activity.discretionaryReview, params: { requestId } }),
    toJoinReview: (requestId: string) =>
      router.push({ pathname: Routes.activity.joinReview, params: { requestId } }),
    toWithdrawalReview: (requestId: string) =>
      router.push({ pathname: Routes.activity.withdrawalReview, params: { requestId } }),
    toLoanDetail: (loanId: string) =>
      router.push({ pathname: Routes.activity.loanDetail, params: { loanId } }),
    toLoanReview: (loanId: string) =>
      router.push({ pathname: Routes.activity.loanReview, params: { loanId } }),
    toLoanRepayments: (memberId: string) =>
      router.push({
        pathname: Routes.activity.transactions,
        params: { type: "loan_repayment", memberId },
      }),
  },

  profile: {
    toGroupSettings: () => router.push(Routes.profile.groupSettings),
    toCommittee: () => router.push(Routes.profile.committee),
    toSettingsReview: (requestId: string) =>
      router.push({ pathname: Routes.profile.settingsReview, params: { requestId } }),
    toLeaveGroupConfirm: () => router.push(Routes.profile.leaveGroupConfirm),
    toLeaveGroupPin: () => router.push(Routes.profile.leaveGroupPin),
    toLeaveGroupSent: () => router.replace(Routes.profile.leaveGroupSent),
  },

  members: {
    toInvite: () => router.push(Routes.members.invite),
  },
};
