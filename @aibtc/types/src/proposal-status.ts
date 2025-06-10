/**
 * @file Defines types and helper functions for tracking the lifecycle and status of AIBTC DAO proposals.
 * @packageDocumentation
 */

/**
 * Defines the input parameters required to determine the status of a DAO proposal.
 * These parameters represent key block heights and timing details in a proposal's lifecycle.
 */
export interface ProposalInputParams {
  /** The current Bitcoin block height. */
  current_btc_block: number;
  /** The Bitcoin block height at which voting is scheduled to start. */
  vote_start: number;
  /** The Bitcoin block height at which voting is scheduled to end. */
  vote_end: number;
  /** The duration (in blocks) of the delay before voting can begin after proposal creation. */
  voting_delay: number;
  /** The duration (in blocks) of the voting period. */
  voting_period: number;
  /** The Bitcoin block height at which the proposal becomes executable. */
  exec_start: number;
  /** The Bitcoin block height at which the proposal execution window closes. */
  exec_end: number;
  /** Optional flag indicating if the proposal has been successfully concluded. Defaults to false. */
  concluded?: boolean;
}

/**
 * Verifies if the provided object conforms to the {@link ProposalInputParams} interface.
 * This is a utility function that checks for the presence and correct types of required properties.
 *
 * @param proposalInputParams - The object to be verified.
 * @returns `true` if the object is a valid `ProposalInputParams`, `false` otherwise.
 */
export function verifyProposalInputParams(
  proposalInputParams: ProposalInputParams
): boolean {
  return (
    typeof proposalInputParams === "object" &&
    typeof proposalInputParams.current_btc_block === "number" &&
    typeof proposalInputParams.vote_start === "number" &&
    typeof proposalInputParams.vote_end === "number" &&
    typeof proposalInputParams.voting_delay === "number" &&
    typeof proposalInputParams.voting_period === "number" &&
    typeof proposalInputParams.exec_start === "number" &&
    typeof proposalInputParams.exec_end === "number"
  );
}

/**
 * A constant array of all possible proposal statuses.
 * This defines the complete set of states a proposal can be in throughout its lifecycle.
 */
export const PROPOSAL_STATUSES = [
  "created", // until we confirm the TX is mined
  "voting_delay", // after proposal is created, but before voting starts
  "voting_active", // when voting is open
  "veto_period", // also an execution delay
  "executable", // not concluded but can be executed
  "expired", // not concluded but cannot be executed anymore
  "concluded", // proposal is concluded, final state
] as const;

/**
 * Represents the status of a DAO proposal.
 * The status is derived from the {@link PROPOSAL_STATUSES} constant array.
 *
 * @example
 * ```
 * let currentStatus: ProposalStatus = "voting_active";
 * ```
 */
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

/**
 * Calculates the current status of a proposal based on its timing parameters and the current block height.
 *
 * @param proposalInputParams - An object containing the proposal's timing data and the current block height.
 * @returns The calculated `ProposalStatus` for the given proposal.
 * @throws {Error} If the `proposalInputParams` object is invalid or missing required properties.
 */
export function getProposalStatus(
  proposalInputParams: ProposalInputParams
): ProposalStatus {
  const errorMessage = new Error(
    "Invalid proposal blocks object. Expected an object with start_block, end_block, and current_btc_block properties."
  );
  // verify provided object has the required properties
  if (verifyProposalInputParams(proposalInputParams) === false) {
    throw errorMessage;
  }
  // extract the start and end blocks from the provided object
  const {
    current_btc_block,
    vote_start,
    vote_end,
    exec_start,
    exec_end,
    concluded,
  } = proposalInputParams;
  // after the proposal is created, but before voting starts
  if (current_btc_block < vote_start) {
    return "voting_delay";
  }
  // during the voting period
  if (current_btc_block >= vote_start && current_btc_block <= vote_end) {
    return "voting_active";
  }
  // after voting ends, but before the execution period starts
  // this is also the veto period
  if (current_btc_block > vote_end && current_btc_block < exec_start) {
    return "veto_period";
  }
  // after the execution period starts, but before it ends
  if (current_btc_block >= exec_start && current_btc_block <= exec_end) {
    return "executable";
  }
  // after the execution period ends and the proposal is concluded
  if (concluded) {
    return "concluded";
  }
  // if the current block is greater than the execution end block, but the proposal is not concluded
  if (current_btc_block > exec_end) {
    return "expired";
  }
  // we shouldn't reach here, but if we do, return created
  return "created";
}

/**
 * A type guard function to check if a given string is a valid `ProposalStatus`.
 *
 * @param status - The string to check.
 * @returns `true` if the string is a valid `ProposalStatus`, otherwise `false`.
 *
 * @example
 * ```
 * if (isProposalStatus(userInput)) {
 *   // userInput is now typed as ProposalStatus
 * }
 * ```
 */
export function isProposalStatus(status: string): status is ProposalStatus {
  return PROPOSAL_STATUSES.includes(status as ProposalStatus);
}
