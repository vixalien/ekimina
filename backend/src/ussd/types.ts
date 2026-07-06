export type USSDContext = {
  phone: string;
  params: Record<string, string>;
};

export type NextKey = string | RegExp;
export type ScreenFn = (ctx: USSDContext, key?: string) => Screen;
export type Screen = {
  response: string;
  params?: Record<string, string>;
  next?: NextMap;
};

export type NextMap = Map<NextKey, ScreenFn>;
