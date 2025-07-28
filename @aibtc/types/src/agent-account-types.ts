import { StacksNetworkName } from "@stacks/network";

/**
 * @file Defines types and helper functions for AIBTC Agent Account contract interactions.
 * @packageDocumentation
 */

/**
 * Defines the approval types for contracts in the AIBTC Agent Account.
 * These correspond to the constants in the `aibtc-agent-account.clar` contract.
 */
export const AGENT_ACCOUNT_APPROVAL_TYPES = {
  VOTING: 1,
  SWAP: 2,
  TOKEN: 3,
} as const;

/**
 * Represents the string keys for agent account approval types.
 * @example
 * let type: AgentAccountApprovalType = "VOTING";
 */
export type AgentAccountApprovalType =
  keyof typeof AGENT_ACCOUNT_APPROVAL_TYPES;

/**
 * Represents the response from the `get-configuration` function in the `aibtc-agent-account` contract.
 */
export interface AgentAccountConfiguration {
  account: string;
  agent: string;
  owner: string;
  sbtc: string;
}

/**
 * Represents the response from the `get-approval-types` function in the `aibtc-agent-account` contract.
 */
export interface AgentAccountApprovalTypes {
  proposalVoting: bigint;
  swap: bigint;
  token: bigint;
}

/**
 * Represents the response from the `get-agent-permissions` function in the `aibtc-agent-account` contract.
 */
export interface AgentAccountPermissions {
  canDeposit: boolean;
  canUseProposals: boolean;
  canApproveRevokeContracts: boolean;
  canBuySell: boolean;
}

/**
 * Defines the default permissions for an agent account on each network.
 * These values correspond to the initial data-var values in the contract.
 */
export const AGENT_ACCOUNT_DEFAULT_PERMISSIONS: Record<
  StacksNetworkName,
  AgentAccountPermissions
> = {
  mainnet: {
    canDeposit: true,
    canUseProposals: true,
    canApproveRevokeContracts: true,
    canBuySell: false,
  },
  testnet: {
    canDeposit: true,
    canUseProposals: true,
    canApproveRevokeContracts: true,
    canBuySell: false,
  },
  devnet: {
    canDeposit: true,
    canUseProposals: true,
    canApproveRevokeContracts: true,
    canBuySell: false,
  },
  mocknet: {
    canDeposit: true,
    canUseProposals: true,
    canApproveRevokeContracts: true,
    canBuySell: false,
  },
};

/**
 * Defines the default deployer principal for an agent account on each network.
 */
export const AGENT_ACCOUNT_DEFAULT_DEPLOYER: Record<StacksNetworkName, string> =
  {
    mainnet: "SP2Z94F6QX847PMXTPJJ2ZCCN79JZDW3PJ4E6ZABY",
    testnet: "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD",
    devnet: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    mocknet: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  };

/**
 * Validates and converts a user-provided approval type (string or number) into the correct numeric value.
 * Throws an error if the input is invalid.
 *
 * @param typeInput - The approval type to validate, can be a string (e.g., "VOTING") or a number (e.g., 1).
 * @returns The corresponding numeric approval type.
 * @throws {Error} If the `typeInput` is not a valid approval type.
 */
export function getAgentAccountApprovalType(typeInput: string | number): number {
  let numericType: number | undefined;
  const validValues = Object.values(AGENT_ACCOUNT_APPROVAL_TYPES);

  if (typeof typeInput === "number") {
    if (validValues.includes(typeInput as any)) {
      numericType = typeInput;
    }
  } else if (typeof typeInput === "string") {
    const approvalTypeNumber = parseInt(typeInput, 10);
    if (!isNaN(approvalTypeNumber)) {
      if (validValues.includes(approvalTypeNumber as any)) {
        numericType = approvalTypeNumber;
      }
    } else {
      const upperApprovalType =
        typeInput.toUpperCase() as AgentAccountApprovalType;
      if (upperApprovalType in AGENT_ACCOUNT_APPROVAL_TYPES) {
        numericType = AGENT_ACCOUNT_APPROVAL_TYPES[upperApprovalType];
      }
    }
  }

  if (numericType === undefined) {
    const validOptions = [
      ...Object.keys(AGENT_ACCOUNT_APPROVAL_TYPES),
      ...validValues,
    ].join(", ");
    throw new Error(
      `Invalid approval type: "${typeInput}". Must be one of: ${validOptions}`
    );
  }

  return numericType;
}

/**
 * Retrieves the default agent permissions for a given network.
 * @param network - The Stacks network name.
 * @returns The default permissions for that network.
 */
export function getAgentAccountDefaultPermissions(
  network: StacksNetworkName
): AgentAccountPermissions {
  return AGENT_ACCOUNT_DEFAULT_PERMISSIONS[network];
}

/**
 * Retrieves the default deployer address for an agent account for a given network.
 * @param network - The Stacks network name.
 * @returns The default deployer address for that network.
 */
export function getAgentAccountDefaultDeployer(
  network: StacksNetworkName
): string {
  return AGENT_ACCOUNT_DEFAULT_DEPLOYER[network];
}
