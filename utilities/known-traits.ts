import { StacksNetworkName } from "@stacks/network";

// define known traits by key and category

export type ExternalTraits = {
  BASE_SIP009: string;
  BASE_SIP010: string;
  FAKTORY_SIP010: string;
  BITFLOW_POOL: string;
  BITFLOW_SIP010: string;
};

type DaoTraits = {
  DAO_BASE: string;
  DAO_PROPOSAL: string;
  DAO_EXTENSION: string;
  DAO_ACTION: string;
  DAO_ACTION_PROPOSAL_VOTING: string;
  DAO_CHARTER: string;
  DAO_EPOCH: string;
  DAO_MESSAGING: string;
  DAO_REWARDS_ACCOUNT: string;
  DAO_TOKEN: string;
  DAO_TOKEN_DEX: string;
  DAO_TOKEN_OWNER: string;
  DAO_TOKEN_POOL: string;
  DAO_TREASURY: string;
  DAO_USERS: string;
};

type AgentTraits = {
  AGENT_ACCOUNT: string;
  AGENT_ACCOUNT_PROPOSALS: string;
  AGENT_ACCOUNT_CONFIG: string;
  AGENT_ACCOUNT_SWAPS: string;
  AGENT_DAO_SWAP_ADAPTER: string;
  AGENT_FAKTORY_BUY_SELL: string;
};

// combine to define known traits
export type KnownTraits = ExternalTraits & DaoTraits & AgentTraits;

// define known traits for each network

const mainnetTraits: KnownTraits = {
  // External traits
  BASE_SIP009: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait",
  BASE_SIP010:
    "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait",
  FAKTORY_SIP010:
    "SP3XXMS38VTAWTVPE5682XSBFXPTH7XCPEBTX8AN2.faktory-trait-v1.sip-010-trait",
  BITFLOW_POOL:
    "SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-trait-v-1-2.xyk-pool-trait",
  BITFLOW_SIP010:
    "SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.sip-010-trait-ft-standard-v-1-1.sip-010-trait",
  // DAO traits
  DAO_BASE:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-v3.aibtc-base-dao",
  DAO_PROPOSAL:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits.proposal",
  DAO_EXTENSION:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits.extension",
  DAO_ACTION:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits.action",
  DAO_ACTION_PROPOSAL_VOTING:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits.action-proposal-voting",
  DAO_CHARTER:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits.charter",
  DAO_EPOCH: "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits.epoch",
  DAO_MESSAGING:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits.messaging",
  DAO_REWARDS_ACCOUNT:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits.rewards-account",
  DAO_TOKEN: "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits.token",
  DAO_TOKEN_DEX:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits.faktory-dex",
  DAO_TOKEN_OWNER:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits.token-owner",
  DAO_TOKEN_POOL:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits.bitflow-pool",
  DAO_TREASURY:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits.treasury",
  DAO_USERS: "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits.users",
  // Agent traits
  AGENT_ACCOUNT:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-agent-account-traits.aibtc-account",
  AGENT_ACCOUNT_PROPOSALS:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-agent-account-traits.aibtc-account-proposals",
  AGENT_ACCOUNT_CONFIG:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-agent-account-traits.aibtc-account-config",
  AGENT_ACCOUNT_SWAPS:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-agent-account-traits.aibtc-account-swaps",
  AGENT_DAO_SWAP_ADAPTER:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-agent-account-traits.aibtc-dao-swap-adapter",
  AGENT_FAKTORY_BUY_SELL:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-agent-account-traits.faktory-buy-sell",
};

const testnetTraits: KnownTraits = {
  // External traits
  BASE_SIP009: "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.nft-trait.nft-trait",
  BASE_SIP010:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.sip-010-trait-ft-standard.sip-010-trait",
  FAKTORY_SIP010:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait",
  BITFLOW_POOL:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.xyk-pool-trait-v-1-2.xyk-pool-trait",
  BITFLOW_SIP010:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.sip-010-trait-ft-standard.sip-010-trait",
  // DAO traits
  DAO_BASE:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-base-dao-trait.aibtc-base-dao",
  DAO_PROPOSAL:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-dao-traits.proposal",
  DAO_EXTENSION:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-dao-traits.extension",
  DAO_ACTION:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-dao-traits.action",
  DAO_ACTION_PROPOSAL_VOTING:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-dao-traits.action-proposal-voting",
  DAO_CHARTER:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-dao-traits.dao-charter",
  DAO_EPOCH:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-dao-traits.dao-epoch",
  DAO_MESSAGING:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-dao-traits.messaging",
  DAO_REWARDS_ACCOUNT:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-dao-traits.rewards-account",
  DAO_TOKEN: "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-dao-traits.token",
  DAO_TOKEN_DEX:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-dao-traits.faktory-dex",
  DAO_TOKEN_OWNER:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-dao-traits.token-owner",
  DAO_TOKEN_POOL:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-dao-traits.bitflow-pool",
  DAO_TREASURY:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-dao-traits.treasury",
  DAO_USERS:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-dao-traits.dao-users",
  // Agent traits
  AGENT_ACCOUNT:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-agent-account-traits.aibtc-account",
  AGENT_ACCOUNT_PROPOSALS:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-agent-account-traits.aibtc-account-proposals",
  AGENT_ACCOUNT_CONFIG:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-agent-account-traits.aibtc-account-config",
  AGENT_ACCOUNT_SWAPS:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-agent-account-traits.aibtc-account-swaps",
  AGENT_DAO_SWAP_ADAPTER:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-agent-account-traits.aibtc-dao-swap-adapter",
  AGENT_FAKTORY_BUY_SELL:
    "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.aibtc-agent-account-traits.faktory-buy-sell",
};

const devnetTraits: KnownTraits = {
  // External traits
  BASE_SIP009: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.nft-trait.nft-trait",
  BASE_SIP010:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait-ft-standard.sip-010-trait",
  FAKTORY_SIP010:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.faktory-trait-v1.sip-010-trait",
  BITFLOW_POOL:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.xyk-pool-trait-v-1-2.xyk-pool-trait",
  BITFLOW_SIP010:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait-ft-standard.sip-010-trait",
  // DAO traits
  DAO_BASE:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-v3.aibtc-base-dao",
  DAO_PROPOSAL:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits.proposal",
  DAO_EXTENSION:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits.extension",
  DAO_ACTION:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits.action",
  DAO_ACTION_PROPOSAL_VOTING:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits.action-proposal-voting",
  DAO_CHARTER:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits.charter",
  DAO_EPOCH: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits.epoch",
  DAO_MESSAGING:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits.messaging",
  DAO_REWARDS_ACCOUNT:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits.rewards-account",
  DAO_TOKEN: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits.token",
  DAO_TOKEN_DEX:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits.faktory-dex",
  DAO_TOKEN_OWNER:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits.token-owner",
  DAO_TOKEN_POOL:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits.bitflow-pool",
  DAO_TREASURY:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits.treasury",
  DAO_USERS: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits.users",
  // Agent traits
  AGENT_ACCOUNT:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-traits.aibtc-account",
  AGENT_ACCOUNT_PROPOSALS:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-traits.aibtc-account-proposals",
  AGENT_ACCOUNT_CONFIG:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-traits.aibtc-account-config",
  AGENT_ACCOUNT_SWAPS:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-traits.aibtc-account-swaps",
  AGENT_DAO_SWAP_ADAPTER:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-traits.aibtc-dao-swap-adapter",
  AGENT_FAKTORY_BUY_SELL:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-traits.faktory-buy-sell",
};

// combine the traits for each network
const TRAITS: Record<StacksNetworkName, KnownTraits> = {
  mainnet: mainnetTraits,
  testnet: testnetTraits,
  devnet: devnetTraits,
  mocknet: devnetTraits,
} as const;

// helper to get known traits for a network
export function getKnownTraits(network: StacksNetworkName): KnownTraits {
  return TRAITS[network];
}

// helper to get a specific trait reference
export function getTraitReference(
  network: StacksNetworkName,
  trait: keyof KnownTraits
): string {
  return TRAITS[network][trait];
}
