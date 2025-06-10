/**
 * Proposal Status Types
 * These types represent the possible statuses of a proposal in the AIBTC DAO.
 * They are used to track the lifecycle of a proposal from creation to execution.
 */

/**
 * Base definition for a proposal, defines expected parameters
 */

export interface ProposalInputParams {
  current_btc_block: number;
  vote_start: number;
  vote_end: number;
  voting_delay: number;
  voting_period: number;
  exec_start: number;
  exec_end: number;
  concluded?: boolean;
}

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
 * Proposal lifecycle status
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

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

/**
 * Helper function to get the status of a proposal
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

export function isProposalStatus(status: string): status is ProposalStatus {
  return PROPOSAL_STATUSES.includes(status as ProposalStatus);
}
