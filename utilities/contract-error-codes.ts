// aibtc-dao-run-cost.clar
export enum ErrCodeDaoRunCost {
  ERR_NOT_OWNER = 1000,
  ERR_ASSET_NOT_ALLOWED,
  ERR_PROPOSAL_MISMATCH,
  ERR_SAVING_PROPOSAL,
}

// aibtc-agent-account.clar
export enum ErrCodeAgentAccount {
  ERR_CALLER_NOT_OWNER = 1100,
  ERR_CONTRACT_NOT_APPROVED,
  ERR_OPERATION_NOT_ALLOWED,
  ERR_INVALID_APPROVAL_TYPE,
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

// aibtc-onchain-messaging.clar
export enum ErrCodeOnchainMessaging {
  ERR_NOT_DAO_OR_EXTENSION = 1600,
  ERR_INVALID_INPUT,
  ERR_FETCHING_TOKEN_DATA,
}

// aibtc-token-owner.clar
export enum ErrCodeTokenOwner {
  ERR_NOT_DAO_OR_EXTENSION = 1800,
}

// aibtc-treasury.clar
export enum ErrCodeTreasury {
  ERR_NOT_DAO_OR_EXTENSION = 1900,
  ERR_ASSET_NOT_ALLOWED,
}

// aibtc-action-send-message.clar
export enum ErrCodeActionSendMessage {
  ERR_NOT_DAO_OR_EXTENSION = 2000,
  ERR_INVALID_PARAMETERS,
}

// aibtc-acct-swap-faktory-aibtc-sbtc.clar
export enum ErrCodeFaktorySwapAdapter {
  ERR_INVALID_DAO_TOKEN = 2200,
  ERR_SWAP_FAILED,
  ERR_QUOTE_FAILED,
  ERR_SLIPPAGE_TOO_HIGH,
}

// aibtc-acct-swap-bitflow-aibtc-sbtc.clar
export enum ErrCodeBitflowSwapAdapter {
  ERR_INVALID_DAO_TOKEN = 2300,
  ERR_SWAP_FAILED,
  ERR_MIN_RECEIVE_REQUIRED,
}

// faktory-buy-and-deposit.clar
export enum ErrCodeFaktoryBuyAndDeposit {
  ERR_INVALID_DAO_TOKEN = 2400,
  ERR_INVALID_AMOUNT,
  ERR_QUOTE_FAILED,
  ERR_SLIPPAGE_TOO_HIGH,
  ERR_REFUNDING_SEATS,
}

// bitflow-buy-and-deposit.clar
export enum ErrCodeBitflowBuyAndDeposit {
  ERR_INVALID_DAO_TOKEN = 2500,
  ERR_INVALID_AMOUNT,
  ERR_MIN_RECEIVE_REQUIRED,
}
