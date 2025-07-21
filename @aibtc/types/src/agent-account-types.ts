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
