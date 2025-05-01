import { expect } from "vitest";
import { Cl, ClarityValue } from "@stacks/transactions";
import { SBTC_CONTRACT } from "./contract-helpers";
import { dbgLog } from "./debug-logging";

export const VOTING_DELAY = 144;
export const VOTING_PERIOD = 288;

// helper to get sBTC from faucet and buy DAO tokens from the token dex
export function getDaoTokens(
  tokenContractAddress: string,
  tokenDexContractAddress: string,
  address: string,
  satsAmount: number
) {
  // get sbtc from the faucet
  const faucetReceipt = simnet.callPublicFn(
    SBTC_CONTRACT,
    "faucet",
    [],
    address
  );
  expect(faucetReceipt.result).toBeOk(Cl.bool(true));
  // get dao tokens from the token dex
  const getDaoTokensReceipt = simnet.callPublicFn(
    tokenDexContractAddress,
    "buy",
    [Cl.principal(tokenContractAddress), Cl.uint(satsAmount)],
    address
  );
  dbgLog(`getDaoTokensReceipt: ${JSON.stringify(getDaoTokensReceipt)}`);
  expect(getDaoTokensReceipt.result).toBeOk(Cl.bool(true));
  // progress chain for at-block calls
  simnet.mineEmptyBlocks(10);
}

// helper to fund voters with random amounts of DAO tokens for voting on proposals
export function fundVoters(
  tokenContractAddress: string,
  tokenDexContractAddress: string,
  voters: string[]
) {
  for (const voter of voters) {
    // get sbtc from the faucet
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      voter
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));
    // generate an amount between 100k and 1M satoshis
    const btcAmount =
      Math.floor(Math.random() * (1000000 - 100000 + 1)) + 100000;
    // get dao tokens from the token dex
    const getDaoTokensReceipt = simnet.callPublicFn(
      tokenDexContractAddress,
      "buy",
      [Cl.principal(tokenContractAddress), Cl.uint(btcAmount)],
      voter
    );
    dbgLog(`getDaoTokensReceipt: ${JSON.stringify(getDaoTokensReceipt)}`);
    expect(getDaoTokensReceipt.result).toBeOk(Cl.bool(true));
    // progress chain for at-block calls
    simnet.mineEmptyBlocks(10);
  }
}

// helper to construct a DAO so proposals can be created/executed
export function constructDao(
  deployer: string,
  baseDaoContractAddress: string,
  bootstrapContractAddress: string
) {
  const constructDaoReceipt = simnet.callPublicFn(
    baseDaoContractAddress,
    "construct",
    [Cl.principal(bootstrapContractAddress)],
    deployer
  );
  expect(constructDaoReceipt.result).toBeOk(Cl.bool(true));
  // progress chain for at-block calls
  simnet.mineEmptyBlocks(10);
}

// helper to pass an action proposal
export function passActionProposal(
  actionProposalsContractAddress: string,
  proposedActionContractAddress: string,
  proposalParams: ClarityValue,
  deployer: string,
  sender: string,
  voters: string[],
  memo?: string
) {
  // create action proposal
  const proposeActionReceipt = simnet.callPublicFn(
    actionProposalsContractAddress,
    "create-action-proposal",
    [
      Cl.principal(proposedActionContractAddress),
      Cl.buffer(Cl.serialize(proposalParams)),
      memo ? Cl.some(Cl.stringAscii(memo)) : Cl.none(),
    ],
    sender
  );
  expect(proposeActionReceipt.result).toBeOk(Cl.bool(true));
  // progress past the voting delay
  simnet.mineEmptyBlocks(VOTING_DELAY);
  // vote on the proposal
  for (const voter of voters) {
    const voteReceipt = simnet.callPublicFn(
      actionProposalsContractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      voter
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));
  }
  // progress past the voting period and execution delay
  simnet.mineEmptyBlocks(VOTING_PERIOD + VOTING_DELAY);
  // conclude the proposal
  const concludeProposalReceipt = simnet.callPublicFn(
    actionProposalsContractAddress,
    "conclude-action-proposal",
    [Cl.uint(1), Cl.principal(proposedActionContractAddress)],
    deployer
  );
  expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));
}
