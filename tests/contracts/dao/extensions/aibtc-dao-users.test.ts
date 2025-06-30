import {
  Cl,
  ClarityType,
  cvToValue,
  SomeCV,
  TupleCV,
} from "@stacks/transactions";
import { describe, expect, it } from "vitest";
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
import { convertClarityTuple } from "../../../../utilities/contract-helpers";

type DaoUserData = {
  address: string;
  createdAt: bigint;
  reputation: bigint;
};

type ProposalCount = {
  proposalCount: bigint;
};

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

// import error codes
const ErrCode = ErrCodeDaoUsers;

describe(`public functions: ${contractName}`, () => {
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

  it("get-or-create-user-index() creates a user when a proposal is made", () => {
    // arrange
    constructDao(deployer);
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
    expect(actionProposalsContract).toBeDefined();
    expect(sendMessageContract).toBeDefined();
    const proposeActionReceipt = simnet.callPublicFn(
      `${deployer}.${actionProposalsContract!.name}`,
      "create-action-proposal",
      [
        Cl.principal(`${deployer}.${sendMessageContract!.name}`),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      address1
    );
    expect(proposeActionReceipt.result).toBeOk(Cl.bool(true));

    // assert
    const expectedUserIndex = Cl.some(Cl.uint(1));
    const newUserIndex = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-index",
      [Cl.principal(address1)],
      deployer
    ).result;
    expect(newUserIndex).toStrictEqual(expectedUserIndex);

    const userDataResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data-by-address",
      [Cl.principal(address1)],
      deployer
    ).result;

    // extract dynamic createdAt value to build expected object
    expect(userDataResult.type).toBe(ClarityType.OptionalSome);
    const userDataResultSome = userDataResult as SomeCV;
    const userDataResultTuple = userDataResultSome.value as TupleCV;
    const userDataResultObj =
      convertClarityTuple<DaoUserData>(userDataResultTuple);
    const createdAt = userDataResultObj.createdAt;
    expect(createdAt).toBeGreaterThan(0n);

    const expectedUserData = Cl.some(
      Cl.tuple({
        address: Cl.principal(address1),
        createdAt: Cl.uint(createdAt),
        reputation: Cl.int(0),
      })
    );
    expect(userDataResult).toStrictEqual(expectedUserData);
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

  it("increase-user-reputation() is called when a proposal passes", () => {
    // arrange
    constructDao(deployer);
    fundVoters([deployer, address1]);
    const actionProposalsContract = registry.getContractByTypeAndSubtype(
      "EXTENSIONS",
      "ACTION_PROPOSAL_VOTING"
    );
    const sendMessageContract = registry.getContractByTypeAndSubtype(
      "ACTIONS",
      "SEND_MESSAGE"
    );
    expect(actionProposalsContract).toBeDefined();
    expect(sendMessageContract).toBeDefined();
    const actionProposalContractAddress = `${deployer}.${
      actionProposalsContract!.name
    }`;
    const sendMessageContractAddress = `${deployer}.${
      sendMessageContract!.name
    }`;

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

    const originalUserDataResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data-by-address",
      [Cl.principal(address1)],
      deployer
    ).result;
    expect(originalUserDataResult.type).toBe(ClarityType.OptionalSome);
    const originalUserDataTuple = (originalUserDataResult as SomeCV)
      .value as TupleCV;
    const originalUserDataObj = convertClarityTuple<DaoUserData>(
      originalUserDataTuple
    );
    const createdAt = originalUserDataObj.createdAt;
    const expectedOriginalUserData = Cl.some(
      Cl.tuple({
        address: Cl.principal(address1),
        createdAt: Cl.uint(createdAt),
        reputation: Cl.int(0),
      })
    );
    expect(originalUserDataResult).toStrictEqual(expectedOriginalUserData);

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
    const updatedUserDataResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data-by-address",
      [Cl.principal(address1)],
      deployer
    ).result;
    const expectedUpdatedUserData = Cl.some(
      Cl.tuple({
        address: Cl.principal(address1),
        createdAt: Cl.uint(createdAt),
        reputation: Cl.int(1), // REP_SUCCESS is u1
      })
    );
    expect(updatedUserDataResult).toStrictEqual(expectedUpdatedUserData);
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

  it("decrease-user-reputation() is called when a proposal fails", () => {
    // arrange: create user and give them some reputation first
    constructDao(deployer);
    passActionProposal(
      "SEND_MESSAGE",
      Cl.stringUtf8("test"),
      deployer,
      address1, // creator
      [deployer, address1] // voters
    );

    const originalUserDataResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data-by-address",
      [Cl.principal(address1)],
      deployer
    ).result;
    expect(originalUserDataResult.type).toBe(ClarityType.OptionalSome);
    const originalUserDataTuple = (originalUserDataResult as SomeCV)
      .value as TupleCV;
    const originalUserDataObj = convertClarityTuple<DaoUserData>(
      originalUserDataTuple
    );
    const createdAt = originalUserDataObj.createdAt;
    const expectedOriginalUserData = Cl.some(
      Cl.tuple({
        address: Cl.principal(address1),
        createdAt: Cl.uint(createdAt),
        reputation: Cl.int(1), // REP_SUCCESS is u1
      })
    );
    expect(originalUserDataResult).toStrictEqual(expectedOriginalUserData);

    // act: create a second proposal that will fail
    const actionProposalsContract = registry.getContractByTypeAndSubtype(
      "EXTENSIONS",
      "ACTION_PROPOSAL_VOTING"
    );
    expect(actionProposalsContract).toBeDefined();
    const actionProposalContractAddress = `${deployer}.${
      actionProposalsContract!.name
    }`;
    const sendMessageContract = registry.getContractByTypeAndSubtype(
      "ACTIONS",
      "SEND_MESSAGE"
    );
    expect(sendMessageContract).toBeDefined();
    const sendMessageContractAddress = `${deployer}.${
      sendMessageContract!.name
    }`;

    // progress chain to allow another proposal
    simnet.mineEmptyBurnBlock();

    // fund voter for second proposal
    fundVoters([address1]);

    // Get the current proposal count to determine the new proposal's ID
    const proposalCountResult = simnet.callReadOnlyFn(
      actionProposalContractAddress,
      "get-total-proposals",
      [],
      deployer
    ).result as TupleCV;
    const { proposalCount } =
      convertClarityTuple<ProposalCount>(proposalCountResult);
    const proposalId = proposalCount + 1n;

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
    const updatedUserDataResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data-by-address",
      [Cl.principal(address1)],
      deployer
    ).result;
    const expectedUpdatedUserData = Cl.some(
      Cl.tuple({
        address: Cl.principal(address1),
        createdAt: Cl.uint(createdAt),
        // REP_SUCCESS is u1, REP_FAILURE is u2. Reputation is int.
        // Start at 1. After failure: 1 - 2 = -1.
        reputation: Cl.int(-1),
      })
    );
    expect(updatedUserDataResult).toStrictEqual(expectedUpdatedUserData);
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
