import { router } from "expo-router";

export const Routes = {
  welcome: "/welcome" as const,
  tabs: "/(tabs)" as const,

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
};
