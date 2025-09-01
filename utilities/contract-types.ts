export const CONTRACT_TYPES = [
  "AGENT", // agent account
  "BASE", // base-dao
  "ACTIONS", // action proposal extensions
  "EXTENSIONS", // dao extensions
  "PROPOSALS", // dao proposals
  "TOKEN", // token, dex, pool, prelaunch
  "TRADING", // adapters for agent accounts
  "CORE", // core contracts like dao-run-cost
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
  ACTIONS: ["SEND_MESSAGE"] as const,
  EXTENSIONS: [
    "ACTION_PROPOSAL_VOTING",
    "DAO_CHARTER",
    "DAO_EPOCH",
    "ONCHAIN_MESSAGING",
    "TOKEN_OWNER",
    "TREASURY",
  ] as const,
  PROPOSALS: ["INITIALIZE_DAO"] as const,
  TOKEN: ["DAO", "DEX", "POOL", "PRELAUNCH"] as const,
  TRADING: [
    "FAKTORY_SBTC",
    "BITFLOW_SBTC",
    "FAKTORY_BUY_AND_DEPOSIT",
    "BITFLOW_BUY_AND_DEPOSIT",
  ] as const,
  CORE: ["DAO_RUN_COST"] as const,
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
    ONCHAIN_MESSAGING: "aibtc-onchain-messaging",
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
  TRADING: {
    FAKTORY_SBTC: "aibtc-acct-swap-faktory-aibtc-sbtc",
    BITFLOW_SBTC: "aibtc-acct-swap-bitflow-aibtc-sbtc",
    FAKTORY_BUY_AND_DEPOSIT: "aibtc-faktory-buy-and-deposit",
    BITFLOW_BUY_AND_DEPOSIT: "aibtc-bitflow-buy-and-deposit",
  },
  CORE: {
    DAO_RUN_COST: "aibtc-dao-run-cost",
  },
};
