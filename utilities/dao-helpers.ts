import { expect } from "vitest";
import {
  Cl,
  ClarityType,
  ClarityValue,
  cvToValue,
} from "@stacks/transactions";
import {
  DEVNET_DEPLOYER,
  SBTC_CONTRACT,
  convertClarityTuple,
} from "./contract-helpers";
import { setupDaoContractRegistry } from "./contract-registry";
import { dbgLog } from "./debug-logging";

export const VOTING_DELAY = 144;
export const VOTING_PERIOD = 288;

// Create a singleton registry instance for use in helpers
const registry = setupDaoContractRegistry();

// helper to get a random amount between min and max
function getRandomAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// helper to get sBTC from the faucet
export function getSbtcFromFaucet(address: string) {
  const faucetReceipt = simnet.callPublicFn(
    SBTC_CONTRACT,
    "faucet",
    [],
    address
  );
  expect(faucetReceipt.result).toBeOk(Cl.bool(true));
}

// helper to get sBTC from faucet and buy DAO tokens from the token dex
export function getDaoTokens(address: string, satsAmount: number) {
  // Get contract references from registry
  const tokenContract = registry.getContractByTypeAndSubtype("TOKEN", "DAO");
  const tokenDexContract = registry.getContractByTypeAndSubtype("TOKEN", "DEX");

  if (!tokenContract || !tokenDexContract) {
    throw new Error("Required token contracts not found in registry");
  }

  // get sbtc from the faucet
  getSbtcFromFaucet(address);

  // get dao tokens from the token dex
  const getDaoTokensReceipt = simnet.callPublicFn(
    `${DEVNET_DEPLOYER}.${tokenDexContract.name}`,
    "buy",
    [
      Cl.principal(`${DEVNET_DEPLOYER}.${tokenContract.name}`),
      Cl.uint(satsAmount),
    ],
    address
  );
  dbgLog(`getDaoTokensReceipt: ${JSON.stringify(getDaoTokensReceipt)}`);
  expect(getDaoTokensReceipt.result).toBeOk(Cl.bool(true));

  // progress chain for at-block calls
  simnet.mineEmptyBlocks(10);
}

// helper to fund voters with random amounts of DAO tokens for voting on proposals
export function fundVoters(voters: string[]) {
  // Get contract references from registry
  const tokenContract = registry.getContractByTypeAndSubtype("TOKEN", "DAO");
  const tokenDexContract = registry.getContractByTypeAndSubtype("TOKEN", "DEX");

  if (!tokenContract || !tokenDexContract) {
    throw new Error("Required token contracts not found in registry");
  }

  for (const voter of voters) {
    // get sbtc from the faucet
    const faucetReceipt = simnet.callPublicFn(
      SBTC_CONTRACT,
      "faucet",
      [],
      voter
    );
    expect(faucetReceipt.result).toBeOk(Cl.bool(true));

    // progress chain
    simnet.mineEmptyBlocks(10);

    // generate an amount between 100k and 1M satoshis
    const btcAmount = getRandomAmount(100_000, 1_000_000);
    dbgLog(`btcAmount: ${btcAmount} satoshis`);

    // get dao tokens from the token dex
    getDaoTokens(voter, btcAmount);

    // progress chain for at-block calls
    simnet.mineEmptyBlocks(10);
  }
}

// helper to fund an agent account with random amounts of sBTC and DAO tokens
export function fundAgentAccount() {
  const agentAccountAddress = registry.getContractAddressByTypeAndSubtype(
    "AGENT",
    "AGENT_ACCOUNT"
  );
  const tokenContractAddress = registry.getContractAddressByTypeAndSubtype(
    "TOKEN",
    "DAO"
  );
  if (!agentAccountAddress) {
    throw new Error("Required agent account not found in registry");
  }
  // get sbtc from the faucet
  const faucetReceipt = simnet.callPublicFn(
    SBTC_CONTRACT,
    "faucet",
    [],
    agentAccountAddress
  );
  expect(faucetReceipt.result).toBeOk(Cl.bool(true));
  // progress chain
  simnet.mineEmptyBlocks(10);
  // generate an amount between 100k and 1M satoshis
  const btcAmount = getRandomAmount(100_000, 1_000_000);
  dbgLog(`btcAmount: ${btcAmount} satoshis`);
  // get dao tokens from the token dex
  getDaoTokens(agentAccountAddress, btcAmount);
  // progress chain
  simnet.mineEmptyBlocks(10);
  // deposit sbtc to the agent account
  const depositSbtcReceipt = simnet.callPublicFn(
    SBTC_CONTRACT,
    "deposit-ft",
    [Cl.principal(SBTC_CONTRACT), Cl.uint(btcAmount)],
    agentAccountAddress
  );
  dbgLog(`depositSbtcReceipt: ${JSON.stringify(depositSbtcReceipt)}`);
  expect(depositSbtcReceipt.result).toBeOk(Cl.bool(true));
  // deposit dao tokens to the agent account
  const depositTokensReceipt = simnet.callPublicFn(
    tokenContractAddress,
    "deposit-ft",
    [Cl.uint(btcAmount)],
    agentAccountAddress
  );
  dbgLog(`depositTokensReceipt: ${JSON.stringify(depositTokensReceipt)}`);
  expect(depositTokensReceipt.result).toBeOk(Cl.bool(true));
}

// helper to construct a DAO so proposals can be created/executed
export function constructDao(deployer: string) {
  // Get contract references from registry
  const baseDaoContract = registry.getContractByTypeAndSubtype("BASE", "DAO");
  const initializeContract = registry.getContractByTypeAndSubtype(
    "PROPOSALS",
    "INITIALIZE_DAO"
  );

  if (!baseDaoContract || !initializeContract) {
    throw new Error("Required DAO contracts not found in registry");
  }

  const constructDaoReceipt = simnet.callPublicFn(
    `${deployer}.${baseDaoContract.name}`,
    "construct",
    [Cl.principal(`${deployer}.${initializeContract.name}`)],
    deployer
  );
  expect(constructDaoReceipt.result).toBeOk(Cl.bool(true));

  // progress chain for at-block calls
  simnet.mineEmptyBlocks(10);
}

// helper to pass an action proposal
export function passActionProposal(
  proposedActionType: "SEND_MESSAGE", // Can be expanded with other action types
  proposalParams: ClarityValue,
  deployer: string,
  sender: string,
  voters: string[],
  memo?: string
) {
  fundVoters(voters);
  // Get contract references from registry
  const actionProposalsContract = registry.getContractByTypeAndSubtype(
    "EXTENSIONS",
    "ACTION_PROPOSAL_VOTING"
  );

  // Get the specific action contract based on the type parameter
  const proposedActionContract = registry.getContractByTypeAndSubtype(
    "ACTIONS",
    proposedActionType
  );

  if (!actionProposalsContract || !proposedActionContract) {
    throw new Error(
      `Required action contracts not found in registry: ${proposedActionType}`
    );
  }

  const actionProposalContractAddress = `${deployer}.${actionProposalsContract.name}`;
  const proposedActionContractAddress = `${deployer}.${proposedActionContract.name}`;

  // Get the current proposal count to determine the new proposal's ID
  const proposalCountResult = simnet.callReadOnlyFn(
    actionProposalContractAddress,
    "get-total-proposals",
    [],
    deployer
  ).result;
  const proposalCount =
    (cvToValue(proposalCountResult).proposalCount.value as bigint) || 0n;
  const proposalId = proposalCount + 1n;

  // create action proposal
  const proposeActionReceipt = simnet.callPublicFn(
    actionProposalContractAddress,
    "create-action-proposal",
    [
      Cl.principal(proposedActionContractAddress),
      formatSerializedBuffer(proposalParams),
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
      actionProposalContractAddress,
      "vote-on-action-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      voter
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));
  }

  // progress past the voting period and execution delay
  simnet.mineEmptyBlocks(VOTING_PERIOD + VOTING_DELAY + 1);

  // conclude the proposal
  const concludeProposalReceipt = simnet.callPublicFn(
    actionProposalContractAddress,
    "conclude-action-proposal",
    [Cl.uint(proposalId), Cl.principal(proposedActionContractAddress)],
    deployer
  );
  dbgLog(concludeProposalReceipt);
  expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));
}

// helper to format the expected buffer format since stacks 7.X
export function formatSerializedBuffer(value: ClarityValue): ClarityValue {
  const serialized = Cl.serialize(value);
  const buffer = Cl.bufferFromHex(serialized);
  return buffer;
}

// helper to complete the pre-launch by buying all seats
export function completePrelaunch(deployer: string) {
  const preFaktoryAddress = registry.getContractAddressByTypeAndSubtype(
    "TOKEN",
    "PRELAUNCH"
  );
  if (!preFaktoryAddress) {
    throw new Error("Pre-faktory contract not found in registry");
  }

  // Check if prelaunch is already complete using the safe tuple converter
  const statusResult = simnet.callReadOnlyFn(
    preFaktoryAddress,
    "get-contract-status",
    [],
    deployer
  ).result;
  if (
    statusResult.type !== ClarityType.ResponseOk ||
    statusResult.value.type !== ClarityType.Tuple
  ) {
    throw new Error("Failed to get pre-faktory contract status");
  }
  const status = convertClarityTuple<{ "distribution-height": bigint }>(
    statusResult.value
  );

  if (status["distribution-height"] > 0n) {
    return; // Already complete
  }

  // Use 5 wallets to buy all 20 seats
  const users = Array.from({ length: 5 }, (_, i) => `wallet_${i + 1}`);
  for (const wallet of users) {
    const userAddress = simnet.getAccounts().get(wallet)!;
    getSbtcFromFaucet(userAddress);
    const buyReceipt = simnet.callPublicFn(
      preFaktoryAddress,
      "buy-up-to",
      [Cl.uint(4)], // Each user buys 4 seats
      userAddress
    );
    expect(buyReceipt.result).toBeOk(Cl.bool(true));
  }

  // Verify distribution was initialized and market is open in pre-faktory
  const finalStatusResult = simnet.callReadOnlyFn(
    preFaktoryAddress,
    "get-contract-status",
    [],
    deployer
  ).result;
  if (
    finalStatusResult.type !== ClarityType.ResponseOk ||
    finalStatusResult.value.type !== ClarityType.Tuple
  ) {
    throw new Error("Failed to get final pre-faktory contract status");
  }
  const finalStatus = convertClarityTuple<{ "market-open": boolean }>(
    finalStatusResult.value
  );
  expect(finalStatus["market-open"]).toBe(true);
}
