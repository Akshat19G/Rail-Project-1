/**
 * Shared demo account credentials.
 *
 * These two accounts are REAL database accounts — the one-click demo buttons
 * sign in to them so demo activity is stored like any other account.
 */

export const DEMO_CREDENTIALS = {
  passenger: {
    email: "amit.demo@railchikitsak.app",
    password: "RailChikitsak#Demo2047",
  },
  doctor: {
    email: "ananya.demo@railchikitsak.app",
    password: "RailChikitsak#Demo2047",
  },
} as const;

export type DemoRole = keyof typeof DEMO_CREDENTIALS;
