import { ClarityVersion } from "@stacks/transactions";

export const CONTRACT_TYPES = [
  "BASE", // base-dao
  "ACTIONS", // action proposal extensions
  "EXTENSIONS", // extensions
  "PROPOSALS", // core proposals
  "EXTERNAL", // sips, bitflow, faktory
  "TOKEN", // token, dex, pool
] as const;

// derive a type from the array
export type ContractType = (typeof CONTRACT_TYPES)[number];

const CONTRACT_SubtypeS = {
  BASE: ["DAO", "AGENT_ACCOUNT", "DAO_RUN_COST"] as const,
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
  (typeof CONTRACT_SubtypeS)[C][number];

// base contract info that persists through all stages
export type BaseContractInfo = {
  [C in ContractType]: {
    name: string;
    type: C;
    Subtype: ContractSubtype<C>;
    deploymentOrder: number; // lower numbers deploy first
    clarityVersion?: ClarityVersion; // optional for deployment
  };
}[ContractType];
