import type { User } from "../types";

export const MOCK_OTP = "123456";

export const MOCK_USERS: Record<string, User> = {
  "+250788123456": {
    id: "user-1",
    phone: "+250788123456",
    name: "Jean Mugabo",
    createdAt: "2025-01-15T10:00:00Z",
  },
  "+250788654321": {
    id: "user-2",
    phone: "+250788654321",
    name: "Marie Uwimana",
    createdAt: "2025-03-20T14:30:00Z",
  },
  "+250788999888": {
    id: "user-3",
    phone: "+250788999888",
    name: null,
    createdAt: "2025-06-01T09:00:00Z",
  },
};
