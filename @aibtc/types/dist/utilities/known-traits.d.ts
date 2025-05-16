import { StacksNetworkName } from "@stacks/network";
type ExternalTraits = {
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
    AGENT_FAKTORY_DEX_APPROVAL: string;
    AGENT_PROPOSALS: string;
    AGENT_FAKTORY_BUY_SELL: string;
};
export type KnownTraits = ExternalTraits & DaoTraits & AgentTraits;
export declare function getKnownTraits(network: StacksNetworkName): KnownTraits;
export declare function getTraitReference(network: StacksNetworkName, trait: keyof KnownTraits): string;
export {};
