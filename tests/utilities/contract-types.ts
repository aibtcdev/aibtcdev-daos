export const CONTRACT_TYPES = [
  "AGENT", // agent account
  "CORE", // core contracts
  "BASE", // base-dao
  "ACTIONS", // action proposal extensions
  "EXTENSIONS", // extensions
  "PROPOSALS", // core proposals
  "EXTERNAL", // sips, bitflow, faktory
  "TOKEN", // token, dex, pool
] as const;

// derive a type from the array
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const CONTRACT_SUBTYPES = {
  AGENT: ["AGENT_ACCOUNT"] as const,
  BASE: ["DAO"] as const,
  CORE: ["DAO_RUN_COST"] as const,
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
  EXTERNAL: [
    "STANDARD_SIP009",
    "STANDARD_SIP010",
    "FAKTORY_SIP010",
    "BITFLOW_POOL",
    "BITFOW_SIP010",
  ] as const,
  TOKEN: ["DAO", "DEX", "POOL", "PRELAUNCH"] as const,
} as const;

// helper type that infers subcategory keys per category
export type ContractSubtype<C extends ContractType> =
  (typeof CONTRACT_SUBTYPES)[C][number];

export const CONTRACT_NAMES: {
  [K in ContractType]: {
    [S in ContractSubtype<K>]?: string;
  };
} = {
  AGENT: {
    AGENT_ACCOUNT: "aibtc-agent-account",
  },
  BASE: {
    DAO: "aibtc-base-dao",
  },
  CORE: {
    DAO_RUN_COST: "aibtc-dao-run-cost",
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
    INITIALIZE_DAO: "aibtc-initialize-dao",
  },
  EXTERNAL: {
    // Fill in as needed
  },
  TOKEN: {
    DAO: "aibtc-faktory",
    DEX: "aibtc-faktory-dex",
    POOL: "xyk-pool-sbtc-aibtc-v-1-1",
    PRELAUNCH: "aibtc-pre-dex",
  },
};
