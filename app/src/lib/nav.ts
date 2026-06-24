import { router } from "expo-router";

function push(path: string, params?: Record<string, string>) {
  if (params) {
    router.push({ pathname: path, params } as any);
  } else {
    router.push(path as any);
  }
}

function replace(path: string, params?: Record<string, string>) {
  if (params) {
    router.replace({ pathname: path, params } as any);
  } else {
    router.replace(path as any);
  }
}

export const nav = { push, replace };
