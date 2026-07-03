const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res;
}

export const backendClient = {
  auth: {
    "otp": {
      send: {
        $post: ({ json }: { json: { phone: string } }) =>
          apiFetch("/auth/otp/send", { method: "POST", body: JSON.stringify(json) }),
      },
      verify: {
        $post: ({ json }: { json: { phone: string; code: string } }) =>
          apiFetch("/auth/otp/verify", { method: "POST", body: JSON.stringify(json) }),
      },
    },
    pin: {
      $post: () => apiFetch("/auth/pin", { method: "POST", body: "{}" }),
      verify: { $post: () => apiFetch("/auth/pin/verify", { method: "POST", body: "{}" }) },
    },
  },
  users: {
    ":address": {
      $get: ({ param }: { param: { address: string } }) =>
        apiFetch(`/users/${param.address}`),
      groups: {
        $get: ({ param }: { param: { address: string } }) =>
          apiFetch(`/users/${param.address}/groups`),
      },
    },
    me: {
      $patch: ({ json }: { json: { name?: string } }) =>
        apiFetch("/users/me", { method: "PATCH", body: JSON.stringify(json) }),
    },
  },
  lookup: {
    names: {
      $post: ({ json }: { json: { addresses: string[] } }) =>
        apiFetch("/lookup/names", { method: "POST", body: JSON.stringify(json) }),
    },
  },
  groups: {
    ":group": {
      $get: ({ param }: { param: { group: string } }) =>
        apiFetch(`/groups/${param.group}`),
      cycle: {
        $get: ({ param }: { param: { group: string } }) =>
          apiFetch(`/groups/${param.group}/cycle`),
      },
      members: {
        $get: ({ param }: { param: { group: string } }) =>
          apiFetch(`/groups/${param.group}/members`),
      },
      contribute: {
        $post: ({ param }: { param: { group: string } }) =>
          apiFetch(`/relay/groups/${param.group}/contribute`, { method: "POST" }),
      },
      "trigger-payout": {
        $post: ({ param }: { param: { group: string } }) =>
          apiFetch(`/relay/groups/${param.group}/trigger-payout`, { method: "POST" }),
      },
    },
    "by-invite": {
      ":code": {
        $get: ({ param }: { param: { code: string } }) =>
          apiFetch(`/groups/by-invite/${param.code}`),
      },
    },
  },
};
