// protocol-fees-account.clar
export enum ErrCodeProtocolFeesAccount {
  ERR_NOT_OWNER = 1000,
}

// aibtc-agent-account.clar
export enum ErrCodeAgentAccount {
  ERR_UNAUTHORIZED = 1100,
  ERR_UNKNOWN_ASSET,
  ERR_OPERATION_FAILED,
  ERR_BUY_SELL_NOT_ALLOWED,
}

// aibtc-base-dao.clar
export enum ErrCodeBaseDao {
  ERR_UNAUTHORIZED = 1200,
  ERR_ALREADY_EXECUTED,
  ERR_INVALID_EXTENSION,
  ERR_NO_EMPTY_LISTS,
  ERR_DAO_ALREADY_CONSTRUCTED,
}

// aibtc-action-proposal-voting.clar
export enum ErrCodeActionProposalVoting {
  ERR_NOT_DAO_OR_EXTENSION = 1300,
  ERR_FETCHING_TOKEN_DATA,
  ERR_INSUFFICIENT_BALANCE,
  ERR_PROPOSAL_NOT_FOUND,
  ERR_PROPOSAL_VOTING_ACTIVE,
  ERR_PROPOSAL_EXECUTION_DELAY,
  ERR_PROPOSAL_RATE_LIMIT,
  ERR_SAVING_PROPOSAL,
  ERR_PROPOSAL_ALREADY_CONCLUDED,
  ERR_RETRIEVING_START_BLOCK_HASH,
  ERR_VOTE_TOO_SOON,
  ERR_VOTE_TOO_LATE,
  ERR_ALREADY_VOTED,
  ERR_INVALID_ACTION,
}

// aibtc-dao-charter.clar
export enum ErrCodeDaoCharter {
  ERR_NOT_DAO_OR_EXTENSION = 1400,
  ERR_SAVING_CHARTER,
  ERR_CHARTER_TOO_SHORT,
  ERR_CHARTER_TOO_LONG,
}

// aibtc-dao-epoch.clar
// no error paths

// aibtc-dao-users.clar
export enum ErrCodeDaoUsers {
  ERR_NOT_DAO_OR_EXTENSION = 1500,
  ERR_USER_NOT_FOUND,
}

// aibtc-onchain-messaging.clar
export enum ErrCodeOnchainMessaging {
  ERR_NOT_DAO_OR_EXTENSION = 1600,
  ERR_INVALID_INPUT,
  ERR_FETCHING_TOKEN_DATA,
}

// aibtc-rewards-account.clar
export enum ErrCodeRewardsAccount {
  ERR_NOT_DAO_OR_EXTENSION = 1700,
  ERR_INSUFFICIENT_BALANCE,
}

// aibtc-token-owner.clar
export enum ErrCodeTokenOwner {
  ERR_NOT_DAO_OR_EXTENSION = 1800,
}

// aibtc-treasury.clar
export enum ErrCodeTreasury {
  ERR_NOT_DAO_OR_EXTENSION = 1900,
  ERR_UNKNOWN_ASSET,
}

// aibtc-action-send-proposal.clar
export enum ErrCodeActionSendProposal {
  ERR_NOT_DAO_OR_EXTENSION = 2000,
}
