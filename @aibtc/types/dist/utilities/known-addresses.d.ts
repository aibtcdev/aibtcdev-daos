import { StacksNetworkName } from "@stacks/network";
export interface KnownAddresses {
    DEPLOYER: string;
    POX: string;
    BURN: string;
    SBTC: string;
    AIBTC_RUN_COST: string;
    BITFLOW_CORE: string;
    BITFLOW_STX_TOKEN: string;
    BITFLOW_FEE: string;
}
export declare function getKnownAddresses(network: StacksNetworkName): KnownAddresses;
export declare function getKnownAddress(network: StacksNetworkName, address: keyof KnownAddresses): string;
