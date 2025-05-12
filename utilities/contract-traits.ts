import { StacksNetworkName } from "@stacks/network";

// define known traits by key and category

type ExternalTraits = {
  STANDARD_SIP009: string;
  STANDARD_SIP010: string;
  FAKTORY_SIP010: string;
  BITFLOW_POOL: string;
  BITFLOW_SIP010: string;
};

type DaoTraits = {
  DAO_BASE: string;
  DAO_PROPOSAL: string;
  DAO_EXTENSION: string;
  DAO_ACTION: string;
  DAO_ACTION_PROPOSALS: string;
  DAO_CHARTER: string;
  DAO_CORE_PROPOSALS: string;
  DAO_INVOICES: string;
  DAO_MESSAGING: string;
  DAO_RESOURCES: string;
  DAO_SMART_WALLET_BASE: string;
  DAO_SMART_WALLET_PROPOSALS: string;
  DAO_SMART_WALLET_FAKTORY: string;
  DAO_TIMED_VAULT: string;
  DAO_TOKEN: string;
  DAO_TOKEN_DEX: string;
  DAO_TOKEN_OWNER: string;
  DAO_TOKEN_POOL: string;
  DAO_TREASURY: string;
};

// combine to define known traits
export type KnownTraits = ExternalTraits & DaoTraits;

// define known traits for each network

const mainnetTraits: KnownTraits = {
  STANDARD_SIP009:
    "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait",
  STANDARD_SIP010:
    "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait",
  FAKTORY_SIP010:
    "SP3XXMS38VTAWTVPE5682XSBFXPTH7XCPEBTX8AN2.faktory-trait-v1.sip-010-trait",
  BITFLOW_POOL:
    "SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-trait-v-1-2.xyk-pool-trait",
  BITFLOW_SIP010:
    "SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.sip-010-trait-ft-standard-v-1-1.sip-010-trait",
  DAO_BASE:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-v3.aibtc-base-dao",
  DAO_PROPOSAL:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.proposal",
  DAO_EXTENSION:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.extension",
  DAO_ACTION:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.action",
  DAO_ACTION_PROPOSALS:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.action-proposals",
  DAO_TIMED_VAULT:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.timed-vault",
  DAO_CHARTER:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.charter",
  DAO_CORE_PROPOSALS:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.core-proposals",
  DAO_INVOICES:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.invoices",
  DAO_MESSAGING:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.messaging",
  DAO_RESOURCES:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.resources",
  DAO_SMART_WALLET_BASE:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-user-agent-traits.aibtc-smart-wallet",
  DAO_SMART_WALLET_PROPOSALS:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-user-agent-traits.aibtc-proposals-v2",
  DAO_SMART_WALLET_FAKTORY:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-user-agent-traits.faktory-buy-sell",
  DAO_TOKEN:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.token",
  DAO_TOKEN_DEX:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.faktory-dex",
  DAO_TOKEN_OWNER:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.token-owner",
  DAO_TOKEN_POOL:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.bitflow-pool",
  DAO_TREASURY:
    "SP29CK9990DQGE9RGTT1VEQTTYH8KY4E3JE5XP4EC.aibtc-dao-traits-v3.treasury",
};

const testnetTraits: KnownTraits = {
  STANDARD_SIP009:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.nft-trait.nft-trait",
  STANDARD_SIP010:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.sip-010-trait-ft-standard.sip-010-trait",
  FAKTORY_SIP010:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait",
  BITFLOW_POOL:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.xyk-pool-trait-v-1-2.xyk-pool-trait",
  BITFLOW_SIP010:
    "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.sip-010-trait-ft-standard.sip-010-trait",
  DAO_BASE:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-v3.aibtc-base-dao",
  DAO_PROPOSAL:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.proposal",
  DAO_EXTENSION:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.extension",
  DAO_ACTION:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.action",
  DAO_ACTION_PROPOSALS:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.action-proposals",
  DAO_TIMED_VAULT:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.timed-vault",
  DAO_CHARTER:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.charter",
  DAO_CORE_PROPOSALS:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.core-proposals",
  DAO_INVOICES:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.invoices",
  DAO_MESSAGING:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.messaging",
  DAO_RESOURCES:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.resources",
  DAO_SMART_WALLET_BASE:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-smart-wallet-traits.aibtc-smart-wallet",
  DAO_SMART_WALLET_PROPOSALS:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-smart-wallet-traits.aibtc-proposals-v2",
  DAO_SMART_WALLET_FAKTORY:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-smart-wallet-traits.faktory-buy-sell",
  DAO_TOKEN:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.token",
  DAO_TOKEN_DEX:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.faktory-dex",
  DAO_TOKEN_OWNER:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.token-owner",
  DAO_TOKEN_POOL:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.bitflow-pool",
  DAO_TREASURY:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v3.treasury",
};

const devnetTraits: KnownTraits = {
  STANDARD_SIP009:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.nft-trait.nft-trait",
  STANDARD_SIP010:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait-ft-standard.sip-010-trait",
  FAKTORY_SIP010:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.faktory-trait-v1.sip-010-trait",
  BITFLOW_POOL:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.xyk-pool-trait-v-1-2.xyk-pool-trait",
  BITFLOW_SIP010:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip-010-trait-ft-standard.sip-010-trait",
  DAO_BASE:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-v3.aibtc-base-dao",
  DAO_PROPOSAL:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.proposal",
  DAO_EXTENSION:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.extension",
  DAO_ACTION:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.action",
  DAO_ACTION_PROPOSALS:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.action-proposals",
  DAO_TIMED_VAULT:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.timed-vault",
  DAO_CHARTER:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.charter",
  DAO_CORE_PROPOSALS:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.core-proposals",
  DAO_INVOICES:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.invoices",
  DAO_MESSAGING:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.messaging",
  DAO_RESOURCES:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.resources",
  DAO_SMART_WALLET_BASE:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-smart-wallet-traits.aibtc-smart-wallet",
  DAO_SMART_WALLET_PROPOSALS:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-smart-wallet-traits.aibtc-proposals-v2",
  DAO_SMART_WALLET_FAKTORY:
    "ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-smart-wallet-traits.faktory-buy-sell",
  DAO_TOKEN:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.token",
  DAO_TOKEN_DEX:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.faktory-dex",
  DAO_TOKEN_OWNER:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.token-owner",
  DAO_TOKEN_POOL:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.bitflow-pool",
  DAO_TREASURY:
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-traits-v3.treasury",
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
