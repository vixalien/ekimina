import { beforeEach } from "vitest";

// oxlint-disable-next-line no-extend-native
(BigInt.prototype as unknown as Record<string, unknown>).toJSON = function (this: bigint) {
  // oxlint-disable-next-line typescript/no-base-to-string
  return String(this);
};

beforeEach(() => {
  // Individual test files handle their own mock state
});
