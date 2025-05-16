export declare const CONTRACT_TYPES: readonly ["AGENT", "BASE", "ACTIONS", "EXTENSIONS", "PROPOSALS", "TOKEN"];
export type ContractType = (typeof CONTRACT_TYPES)[number];
export type AllContractSubtypes = {
    [T in ContractType]: ContractSubtype<T>;
}[ContractType];
export declare const CONTRACT_SUBTYPES: {
    readonly AGENT: readonly ["AGENT_ACCOUNT"];
    readonly BASE: readonly ["DAO"];
    readonly ACTIONS: readonly ["SEND_MESSAGE"];
    readonly EXTENSIONS: readonly ["ACTION_PROPOSAL_VOTING", "DAO_CHARTER", "DAO_EPOCH", "DAO_USERS", "ONCHAIN_MESSAGING", "REWARDS_ACCOUNT", "TOKEN_OWNER", "TREASURY"];
    readonly PROPOSALS: readonly ["INITIALIZE_DAO"];
    readonly TOKEN: readonly ["DAO", "DEX", "POOL", "PRELAUNCH"];
};
export type ContractSubtype<C extends ContractType> = (typeof CONTRACT_SUBTYPES)[C][number];
export declare const CONTRACT_NAMES: {
    [K in ContractType]: {
        [S in ContractSubtype<K>]: string;
    };
};
