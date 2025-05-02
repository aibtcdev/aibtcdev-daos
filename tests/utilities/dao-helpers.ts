import { expect } from "vitest";
import { Cl, ClarityValue } from "@stacks/transactions";
import { SBTC_CONTRACT } from "./contract-helpers";
import { dbgLog } from "./debug-logging";
import { setupDaoContractRegistry } from "./contract-registry";
import { ContractRegistry } from "./contract-registry";

export const VOTING_DELAY = 144;
export const VOTING_PERIOD = 288;

// Create a singleton registry instance for use in helpers
const registry = setupDaoContractRegistry();

// helper to get sBTC from faucet and buy DAO tokens from the token dex
export function getDaoTokens(address: string, satsAmount: number) {
  // Get contract references from registry
  const tokenContract = registry.getContractByTypeAndSubtype("TOKEN", "DAO");
  const tokenDexContract = registry.getContractByTypeAndSubtype("TOKEN", "DEX");

  if (!tokenContract || !tokenDexContract) {
    throw new Error("Required token contracts not found in registry");
  }

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
    tokenDexContract.name,
    "buy",
    [Cl.principal(tokenContract.name), Cl.uint(satsAmount)],
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

    // generate an amount between 100k and 1M satoshis
    const btcAmount =
      Math.floor(Math.random() * (1000000 - 100000 + 1)) + 100000;

    // get dao tokens from the token dex
    const getDaoTokensReceipt = simnet.callPublicFn(
      tokenDexContract.name,
      "buy",
      [Cl.principal(tokenContract.name), Cl.uint(btcAmount)],
      voter
    );
    dbgLog(`getDaoTokensReceipt: ${JSON.stringify(getDaoTokensReceipt)}`);
    expect(getDaoTokensReceipt.result).toBeOk(Cl.bool(true));

    // progress chain for at-block calls
    simnet.mineEmptyBlocks(10);
  }
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

  // create action proposal
  const proposeActionReceipt = simnet.callPublicFn(
    actionProposalsContract.name,
    "create-action-proposal",
    [
      Cl.principal(proposedActionContract.name),
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
      actionProposalsContract.name,
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
    actionProposalsContract.name,
    "conclude-action-proposal",
    [Cl.uint(1), Cl.principal(proposedActionContract.name)],
    deployer
  );
  expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));
}

// Optional: Allow using a custom registry for testing different configurations
export function useCustomRegistry(customRegistry: ContractRegistry) {
  return {
    getDaoTokens: (address: string, satsAmount: number) => {
      // Get contract references from registry
      const tokenContract = customRegistry.getContractByTypeAndSubtype(
        "TOKEN",
        "DAO"
      );
      const tokenDexContract = customRegistry.getContractByTypeAndSubtype(
        "TOKEN",
        "DEX"
      );

      if (!tokenContract || !tokenDexContract) {
        throw new Error("Required token contracts not found in registry");
      }

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
        tokenDexContract.name,
        "buy",
        [Cl.principal(tokenContract.name), Cl.uint(satsAmount)],
        address
      );
      dbgLog(`getDaoTokensReceipt: ${JSON.stringify(getDaoTokensReceipt)}`);
      expect(getDaoTokensReceipt.result).toBeOk(Cl.bool(true));

      // progress chain for at-block calls
      simnet.mineEmptyBlocks(10);
    },

    fundVoters: (voters: string[]) => {
      // Get contract references from registry
      const tokenContract = customRegistry.getContractByTypeAndSubtype(
        "TOKEN",
        "DAO"
      );
      const tokenDexContract = customRegistry.getContractByTypeAndSubtype(
        "TOKEN",
        "DEX"
      );

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

        // generate an amount between 100k and 1M satoshis
        const btcAmount =
          Math.floor(Math.random() * (1000000 - 100000 + 1)) + 100000;

        // get dao tokens from the token dex
        const getDaoTokensReceipt = simnet.callPublicFn(
          tokenDexContract.name,
          "buy",
          [Cl.principal(tokenContract.name), Cl.uint(btcAmount)],
          voter
        );
        dbgLog(`getDaoTokensReceipt: ${JSON.stringify(getDaoTokensReceipt)}`);
        expect(getDaoTokensReceipt.result).toBeOk(Cl.bool(true));

        // progress chain for at-block calls
        simnet.mineEmptyBlocks(10);
      }
    },

    constructDao: (deployer: string) => {
      // Get contract references from registry
      const baseDaoContract = customRegistry.getContractByTypeAndSubtype(
        "BASE",
        "DAO"
      );
      const initializeContract = customRegistry.getContractByTypeAndSubtype(
        "PROPOSALS",
        "INITIALIZE_DAO"
      );

      if (!baseDaoContract || !initializeContract) {
        throw new Error("Required DAO contracts not found in registry");
      }

      const constructDaoReceipt = simnet.callPublicFn(
        baseDaoContract.name,
        "construct",
        [Cl.principal(initializeContract.name)],
        deployer
      );
      expect(constructDaoReceipt.result).toBeOk(Cl.bool(true));

      // progress chain for at-block calls
      simnet.mineEmptyBlocks(10);
    },

    passActionProposal: (
      proposedActionType: "SEND_MESSAGE",
      proposalParams: ClarityValue,
      deployer: string,
      sender: string,
      voters: string[],
      memo?: string
    ) => {
      // Get contract references from registry
      const actionProposalsContract =
        customRegistry.getContractByTypeAndSubtype(
          "EXTENSIONS",
          "ACTION_PROPOSAL_VOTING"
        );

      // Get the specific action contract based on the type parameter
      const proposedActionContract = customRegistry.getContractByTypeAndSubtype(
        "ACTIONS",
        proposedActionType
      );

      if (!actionProposalsContract || !proposedActionContract) {
        throw new Error(
          `Required action contracts not found in registry: ${proposedActionType}`
        );
      }

      // create action proposal
      const proposeActionReceipt = simnet.callPublicFn(
        actionProposalsContract.name,
        "create-action-proposal",
        [
          Cl.principal(proposedActionContract.name),
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
          actionProposalsContract.name,
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
        actionProposalsContract.name,
        "conclude-action-proposal",
        [Cl.uint(1), Cl.principal(proposedActionContract.name)],
        deployer
      );
      expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));
    },
  };
}
