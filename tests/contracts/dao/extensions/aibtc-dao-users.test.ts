import { Cl, cvToValue } from "@stacks/transactions";
import { beforeEach, describe, expect, it } from "vitest";
import { ErrCodeDaoUsers } from "../../../../utilities/contract-error-codes";
import { setupDaoContractRegistry } from "../../../../utilities/contract-registry";
import {
  constructDao,
  fundVoters,
  passActionProposal,
  formatSerializedBuffer,
  VOTING_DELAY,
  VOTING_PERIOD,
} from "../../../../utilities/dao-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;

// setup contract info for tests
const registry = setupDaoContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "EXTENSIONS",
  "DAO_USERS"
);
const contractName = contractAddress.split(".")[1];
const daoAddress = registry.getContractAddressByTypeAndSubtype("BASE", "DAO");

console.log("Contract address:", contractAddress);
console.log("Contract name:", contractName);
console.log("DAO address:", daoAddress);

// import error codes
const ErrCode = ErrCodeDaoUsers;

describe(`public functions (direct calls): ${contractName}`, () => {
  ////////////////////////////////////////
  // callback() tests
  ////////////////////////////////////////
  it("callback() should respond with (ok true)", () => {
    // arrange

    // act
    const callback = simnet.callPublicFn(
      contractAddress,
      "callback",
      [Cl.principal(deployer), Cl.bufferFromAscii("test")],
      deployer
    );

    // assert
    expect(callback.result).toBeOk(Cl.bool(true));
  });

  ////////////////////////////////////////
  // get-or-create-user-index() tests
  ////////////////////////////////////////
  it("get-or-create-user-index() fails if called directly", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "get-or-create-user-index",
      [Cl.principal(address1)],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });

  ////////////////////////////////////////
  // increase-user-reputation() tests
  ////////////////////////////////////////
  it("increase-user-reputation() fails if called directly", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "increase-user-reputation",
      [Cl.principal(address1), Cl.uint(5)],
      address1
    );
    // assert - if a user is not found this this error path first
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_USER_NOT_FOUND));
  });

  ////////////////////////////////////////
  // decrease-user-reputation() tests
  ////////////////////////////////////////
  it("decrease-user-reputation() fails if called directly", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "decrease-user-reputation",
      [Cl.principal(address1), Cl.uint(5)],
      address1
    );
    // assert - if a user is not found this this error path first
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_USER_NOT_FOUND));
  });
});

describe(`DAO-context functions: ${contractName}`, () => {
  beforeEach(() => {
    // arrange
    constructDao(deployer);
  });

  it("get-or-create-user-index() creates a user when a proposal is made", () => {
    // arrange
    fundVoters([address1]); // fund the user to create a proposal
    const userIndex = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-index",
      [Cl.principal(address1)],
      deployer
    ).result;
    expect(userIndex).toBeNone(); // user should not exist yet

    // act
    // Creating a proposal will call get-or-create-user-index
    const actionProposalsContract = registry.getContractByTypeAndSubtype(
      "EXTENSIONS",
      "ACTION_PROPOSAL_VOTING"
    );
    const sendMessageContract = registry.getContractByTypeAndSubtype(
      "ACTIONS",
      "SEND_MESSAGE"
    );
    const proposeActionReceipt = simnet.callPublicFn(
      `${deployer}.${actionProposalsContract.name}`,
      "create-action-proposal",
      [
        Cl.principal(`${deployer}.${sendMessageContract.name}`),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      address1
    );
    expect(proposeActionReceipt.result).toBeOk(Cl.bool(true));

    // assert
    const newUserIndex = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-index",
      [Cl.principal(address1)],
      deployer
    ).result;
    expect(newUserIndex).toStrictEqual(Cl.some(Cl.uint(1)));

    const userData = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data-by-address",
      [Cl.principal(address1)],
      deployer
    ).result;

    expect(userData).toSatisfy(
      (r: any) => r.value.data.address.value === address1
    );
    expect(userData).toSatisfy(
      (r: any) => r.value.data.reputation.value === 0n
    );
    expect(userData).toSatisfy((r: any) => r.value.data.createdAt.value > 0n);
  });

  it("increase-user-reputation() updates reputation when a proposal passes and preserves createdAt", () => {
    // arrange
    fundVoters([deployer, address1]);
    const actionProposalsContract = registry.getContractByTypeAndSubtype(
      "EXTENSIONS",
      "ACTION_PROPOSAL_VOTING"
    );
    const sendMessageContract = registry.getContractByTypeAndSubtype(
      "ACTIONS",
      "SEND_MESSAGE"
    );
    const actionProposalContractAddress = `${deployer}.${actionProposalsContract.name}`;
    const sendMessageContractAddress = `${deployer}.${sendMessageContract.name}`;

    // Create proposal from address1. This will create the user.
    const proposeActionReceipt = simnet.callPublicFn(
      actionProposalContractAddress,
      "create-action-proposal",
      [
        Cl.principal(sendMessageContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      address1
    );
    expect(proposeActionReceipt.result).toBeOk(Cl.bool(true));

    const originalUserData = cvToValue(
      simnet.callReadOnlyFn(
        contractAddress,
        "get-user-data-by-address",
        [Cl.principal(address1)],
        deployer
      ).result
    );
    expect(originalUserData.reputation).toBe(0n);

    // act: pass the proposal
    const proposalId = 1;
    simnet.mineEmptyBlocks(VOTING_DELAY);

    const voteReceipt = simnet.callPublicFn(
      actionProposalContractAddress,
      "vote-on-action-proposal",
      [Cl.uint(proposalId), Cl.bool(true)],
      deployer
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));

    simnet.mineEmptyBlocks(VOTING_PERIOD + VOTING_DELAY + 1);

    const concludeProposalReceipt = simnet.callPublicFn(
      actionProposalContractAddress,
      "conclude-action-proposal",
      [Cl.uint(proposalId), Cl.principal(sendMessageContractAddress)],
      deployer
    );
    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(true));

    // assert
    const updatedUserData = cvToValue(
      simnet.callReadOnlyFn(
        contractAddress,
        "get-user-data-by-address",
        [Cl.principal(address1)],
        deployer
      ).result
    );
    expect(updatedUserData.reputation).toBe(1n); // REP_SUCCESS is u1
    expect(updatedUserData.createdAt).toBe(originalUserData.createdAt);
  });

  it("decrease-user-reputation() updates reputation when a proposal fails and preserves createdAt", () => {
    // arrange: create user and give them some reputation first
    fundVoters([deployer, address1]);
    passActionProposal(
      "SEND_MESSAGE",
      Cl.stringUtf8("test"),
      deployer,
      address1, // creator
      [deployer, address1] // voters
    );

    const originalUserData = cvToValue(
      simnet.callReadOnlyFn(
        contractAddress,
        "get-user-data-by-address",
        [Cl.principal(address1)],
        deployer
      ).result
    );
    // REP_SUCCESS is u1
    expect(originalUserData.reputation).toBe(1n);

    // act: create a second proposal that will fail
    const actionProposalsContract = registry.getContractByTypeAndSubtype(
      "EXTENSIONS",
      "ACTION_PROPOSAL_VOTING"
    );
    const actionProposalContractAddress = `${deployer}.${actionProposalsContract.name}`;
    const sendMessageContract = registry.getContractByTypeAndSubtype(
      "ACTIONS",
      "SEND_MESSAGE"
    );
    const sendMessageContractAddress = `${deployer}.${sendMessageContract.name}`;

    // progress chain to allow another proposal
    simnet.mineEmptyBurnBlock();

    // fund voter for second proposal
    fundVoters([address1]);

    const proposeActionReceipt = simnet.callPublicFn(
      actionProposalContractAddress,
      "create-action-proposal",
      [
        Cl.principal(sendMessageContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("another test")),
        Cl.none(),
      ],
      address1 // creator
    );
    expect(proposeActionReceipt.result).toBeOk(Cl.bool(true));
    const proposalId = 2;

    // progress past the voting delay
    simnet.mineEmptyBlocks(VOTING_DELAY);

    // vote 'no' on the proposal to make it fail
    const voteReceipt = simnet.callPublicFn(
      actionProposalContractAddress,
      "vote-on-action-proposal",
      [Cl.uint(proposalId), Cl.bool(false)],
      deployer
    );
    expect(voteReceipt.result).toBeOk(Cl.bool(true));

    // progress past the voting period and execution delay
    simnet.mineEmptyBlocks(VOTING_PERIOD + VOTING_DELAY + 1);

    // conclude the proposal
    const concludeProposalReceipt = simnet.callPublicFn(
      actionProposalContractAddress,
      "conclude-action-proposal",
      [Cl.uint(proposalId), Cl.principal(sendMessageContractAddress)],
      deployer
    );
    expect(concludeProposalReceipt.result).toBeOk(Cl.bool(false));

    // assert
    const updatedUserData = cvToValue(
      simnet.callReadOnlyFn(
        contractAddress,
        "get-user-data-by-address",
        [Cl.principal(address1)],
        deployer
      ).result
    );
    // REP_SUCCESS is u1, REP_FAILURE is u2. Reputation is int.
    // Start at 0. After success: 0 + 1 = 1. After failure: 1 - 2 = -1.
    expect(updatedUserData.reputation).toBe(-1n);
    expect(updatedUserData.createdAt).toBe(originalUserData.createdAt);
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-user-count() tests
  ////////////////////////////////////////
  it("get-user-count() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-count",
      [],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.uint(0));
  });

  ////////////////////////////////////////
  // get-user-index() tests
  ////////////////////////////////////////
  it("get-user-index() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-index",
      [Cl.principal(address1)],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });

  ////////////////////////////////////////
  // get-user-data-by-index() tests
  ////////////////////////////////////////
  it("get-user-data-by-index() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data-by-index",
      [Cl.uint(1)],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });

  ////////////////////////////////////////
  // get-user-data-by-address() tests
  ////////////////////////////////////////
  it("get-user-data-by-address() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data-by-address",
      [Cl.principal(address1)],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });
});
