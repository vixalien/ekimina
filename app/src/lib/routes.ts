import { router } from "expo-router";

export const Routes = {
  welcome: "/welcome" as const,
  tabs: "/(tabs)/home" as const,

  onboarding: {
    phone: "/(onboarding)/phone" as const,
    verify: "/(onboarding)/verify" as const,
    joinOrCreate: "/(onboarding)/join-or-create" as const,
    inviteCode: "/(onboarding)/invite-code" as const,
    searchGroups: "/(onboarding)/search-groups" as const,
    pending: "/(onboarding)/pending" as const,

    signup: {
      name: "/(onboarding)/signup/name",
      wallet: "/(onboarding)/signup/wallet",
    },

    createGroup: {
      step: (n: 1 | 2 | 3 | 4 | 5 | 6) => `/(onboarding)/create-group/step-${n}` as const,
      success: "/(onboarding)/create-group/success" as const,
    },
  },

  activity: {
    transactions: "/(tabs)/activity/transactions" as const,
    detail: (id: string) => `/(tabs)/activity/${id}` as const,
    discretionaryRequest: "/(tabs)/activity/discretionary-request" as const,
    discretionaryReview: (id: string) => `/(tabs)/activity/discretionary-review/${id}` as const,
    joinReview: (id: string) => `/(tabs)/activity/join-review/${id}` as const,
    withdrawalReview: (id: string) => `/(tabs)/activity/withdrawal-review/${id}` as const,
    loanDetail: (loanId: string) => `/(tabs)/activity/loan/${loanId}` as const,
    loanReview: (loanId: string) => `/(tabs)/activity/loan-review/${loanId}` as const,
  },

  profile: {
    groupSettings: "/(tabs)/profile/group-settings" as const,
    committee: "/(tabs)/profile/committee" as const,
    settingsReview: "/(tabs)/profile/settings-review" as const,
  },

  members: {
    invite: "/(tabs)/members/invite" as const,
  },
} as const;

export const nav = {
  toWelcome: () => router.replace(Routes.welcome),
  toTabs: () => router.replace(Routes.tabs),
  back: () => router.back(),

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
      toName: () => router.push(Routes.onboarding.signup.name as any),
      toWallet: () => router.push(Routes.onboarding.signup.wallet as any),
    },

    createGroup: {
      toStep: (n: 1 | 2 | 3 | 4 | 5 | 6 = 1) =>
        router.push(Routes.onboarding.createGroup.step(n) as any),
      toSuccess: () => router.replace(Routes.onboarding.createGroup.success),
    },
  },

  activity: {
    toTransactions: () => router.push(Routes.activity.transactions as any),
    toDetail: (id: string) => router.push(Routes.activity.detail(id) as any),
    toDiscretionaryRequest: () => router.push(Routes.activity.discretionaryRequest as any),
    toDiscretionaryReview: (requestId: string) =>
      router.push({ pathname: Routes.activity.discretionaryReview(requestId) as any }),
    toJoinReview: (requestId: string) =>
      router.push({ pathname: Routes.activity.joinReview(requestId) as any }),
    toWithdrawalReview: (requestId: string) =>
      router.push({ pathname: Routes.activity.withdrawalReview(requestId) as any }),
    toLoanDetail: (loanId: string) => router.push(Routes.activity.loanDetail(loanId) as any),
    toLoanReview: (loanId: string) => router.push(Routes.activity.loanReview(loanId) as any),
    toLoanRepayments: (memberId: string) =>
      router.push({
        pathname: Routes.activity.transactions as any,
        params: { type: "loan_repayment", memberId },
      }),
  },

  profile: {
    toGroupSettings: () => router.push(Routes.profile.groupSettings as any),
    toCommittee: () => router.push(Routes.profile.committee as any),
    toSettingsReview: (requestId: string) =>
      router.push({ pathname: Routes.profile.settingsReview as any, params: { requestId } }),
  },

  members: {
    toInvite: () => router.push(Routes.members.invite as any),
  },
};
