export const CONTRACT_TYPES = [
  "AGENT", // agent account
  "BASE", // base-dao
  "ACTIONS", // action proposal extensions
  "EXTENSIONS", // extensions
  "PROPOSALS", // core proposals
  "TOKEN", // token, dex, pool
] as const;

// derive a type from the array
export type ContractType = (typeof CONTRACT_TYPES)[number];

// Helper type to get all possible subtypes across all contract types
export type AllContractSubtypes = {
  [T in ContractType]: ContractSubtype<T>;
}[ContractType];

export const CONTRACT_SUBTYPES = {
  AGENT: ["AGENT_ACCOUNT"] as const,
  BASE: ["DAO"] as const,
  ACTIONS: ["SEND_MESSAGE"],
  EXTENSIONS: [
    "ACTION_PROPOSAL_VOTING",
    "DAO_CHARTER",
    "DAO_EPOCH",
    "DAO_USERS",
    "ONCHAIN_MESSAGING",
    "REWARDS_ACCOUNT",
    "TOKEN_OWNER",
    "TREASURY",
  ],
  PROPOSALS: ["INITIALIZE_DAO"],
  TOKEN: ["DAO", "DEX", "POOL", "PRELAUNCH"] as const,
} as const;

// helper type that infers subcategory keys per category
export type ContractSubtype<C extends ContractType> =
  (typeof CONTRACT_SUBTYPES)[C][number];

export const CONTRACT_NAMES: {
  [K in ContractType]: {
    [S in ContractSubtype<K>]: string;
  };
} = {
  AGENT: {
    AGENT_ACCOUNT: "aibtc-agent-account",
  },
  BASE: {
    DAO: "aibtc-base-dao",
  },
  ACTIONS: {
    SEND_MESSAGE: "aibtc-action-send-message",
  },
  EXTENSIONS: {
    ACTION_PROPOSAL_VOTING: "aibtc-action-proposal-voting",
    DAO_CHARTER: "aibtc-dao-charter",
    DAO_EPOCH: "aibtc-dao-epoch",
    DAO_USERS: "aibtc-dao-users",
    ONCHAIN_MESSAGING: "aibtc-onchain-messaging",
    REWARDS_ACCOUNT: "aibtc-rewards-account",
    TOKEN_OWNER: "aibtc-token-owner",
    TREASURY: "aibtc-treasury",
  },
  PROPOSALS: {
    INITIALIZE_DAO: "aibtc-base-initialize-dao",
  },
  TOKEN: {
    DAO: "aibtc-faktory",
    DEX: "aibtc-faktory-dex",
    POOL: "xyk-pool-sbtc-aibtc-v-1-1",
    PRELAUNCH: "aibtc-pre-faktory",
  },
};
