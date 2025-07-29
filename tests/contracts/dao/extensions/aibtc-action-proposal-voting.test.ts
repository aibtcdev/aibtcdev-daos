import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import {
  ErrCodeActionProposalVoting,
  ErrCodeActionSendMessage,
} from "../../../../utilities/contract-error-codes";
import { setupDaoContractRegistry } from "../../../../utilities/contract-registry";
import {
  completePrelaunch,
  constructDao,
  formatSerializedBuffer,
  fundVoters,
  passActionProposal,
  VOTING_DELAY,
  VOTING_PERIOD,
} from "../../../../utilities/dao-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;

// setup contract info for tests
const registry = setupDaoContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "EXTENSIONS",
  "ACTION_PROPOSAL_VOTING"
);
const contractName = contractAddress.split(".")[1];
const treasuryContractAddress = registry.getContractAddressByTypeAndSubtype(
  "EXTENSIONS",
  "TREASURY"
);
const actionContractAddress = registry.getContractAddressByTypeAndSubtype(
  "ACTIONS",
  "SEND_MESSAGE"
);

// import error codes
const ErrCode = ErrCodeActionProposalVoting;
const ActionErrCode = ErrCodeActionSendMessage;

describe.skip(`public functions: ${contractName}`, () => {
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
  // create-action-proposal() tests
  ////////////////////////////////////////

  it("create-action-proposal() fails if action is not a dao extension", () => {
    // arrange
    constructDao(deployer);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(`${deployer}.unknown-action`),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_ACTION));
  });

  it("create-action-proposal() fails if parameters are not correctly formatted", () => {
    // arrange
    constructDao(deployer);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.tuple({ test: Cl.list([Cl.uint(1)]) })),
        Cl.none(),
      ],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(
      Cl.uint(ActionErrCode.ERR_INVALID_PARAMETERS)
    );
  });

  it("create-action-proposal() fails if called twice in the same btc block", () => {
    // arrange
    completePrelaunch(deployer);
    fundVoters([deployer]);
    constructDao(deployer);
    // create first proposal
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt2 = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    );
    // assert
    expect(receipt2.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_RATE_LIMIT));
    // arrange
    // progress chain to next burn block
    simnet.mineEmptyBurnBlock();
    // act
    const receipt3 = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    );
    // assert
    expect(receipt3.result).toBeOk(Cl.bool(true));
  });

  it("create-action-proposal() fails if caller has an insufficient balance", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INSUFFICIENT_BALANCE));
  });

  it("create-action-proposal() succeeds if called with sufficient balance", () => {
    // arrange
    completePrelaunch(deployer);
    fundVoters([deployer]);
    constructDao(deployer);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  ////////////////////////////////////////
  // vote-on-action-proposal() tests
  ////////////////////////////////////////

  it("vote-on-action-proposal() fails if proposal not found", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(999), Cl.bool(true)],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND));
  });

  it("vote-on-action-proposal() fails if voter has an insufficient balance", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INSUFFICIENT_BALANCE));
  });

  it("vote-on-action-proposal() fails if proposal is already concluded", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    passActionProposal(
      "SEND_MESSAGE",
      Cl.stringUtf8("test"),
      deployer,
      deployer,
      [deployer]
    );
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(
      Cl.uint(ErrCode.ERR_PROPOSAL_ALREADY_CONCLUDED)
    );
  });

  it("vote-on-action-proposal() fails if proposal vote is too early", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_VOTE_TOO_SOON));
  });

  it("vote-on-action-proposal() fails if proposal vote is too late", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // progress chain past voting delay and period
    simnet.mineEmptyBlocks(VOTING_DELAY + VOTING_PERIOD);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_VOTE_TOO_LATE));
  });

  it("vote-on-action-proposal() fails if updated vote matches existing vote", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // progress chain past voting delay and period
    simnet.mineEmptyBlocks(VOTING_DELAY);
    const setupReceipt2 = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    );
    expect(setupReceipt2.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_ALREADY_VOTED));
  });

  it("vote-on-action-proposal() succeeds and records vote info", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // progress chain past voting delay and period
    simnet.mineEmptyBlocks(VOTING_DELAY);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  it("vote-on-action-proposal() succeeds if vote is cast then changed during vote window", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // progress chain past voting delay and period
    simnet.mineEmptyBlocks(VOTING_DELAY);
    //
    const setupReceipt2 = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    );
    expect(setupReceipt2.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(false)],
      deployer
    );
    expect(receipt.result).toBeOk(Cl.bool(true));
    // act
    const receipt2 = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    );
    expect(receipt2.result).toBeOk(Cl.bool(true));
  });

  ////////////////////////////////////////
  // veto-action-proposal() tests
  ////////////////////////////////////////

  it("veto-action-proposal() fails if proposal not found", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "veto-action-proposal",
      [Cl.uint(999)],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND));
  });

  it("veto-action-proposal() fails if proposal is already concluded", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    passActionProposal(
      "SEND_MESSAGE",
      Cl.stringUtf8("test"),
      deployer,
      deployer,
      [deployer]
    );
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "veto-action-proposal",
      [Cl.uint(1)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(
      Cl.uint(ErrCode.ERR_PROPOSAL_ALREADY_CONCLUDED)
    );
  });

  it("veto-action-proposal() fails if veto vote is too early", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "veto-action-proposal",
      [Cl.uint(1)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_VOTE_TOO_SOON));
  });

  it("veto-action-proposal() fails if veto vote is too late", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // progress chain past voting delay, voting period, and veto delay
    simnet.mineEmptyBlocks(VOTING_DELAY + VOTING_PERIOD + VOTING_DELAY);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "veto-action-proposal",
      [Cl.uint(1)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_VOTE_TOO_LATE));
  });

  it("veto-action-proposal() fails if veto vote already recorded", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // progress chain past voting delay and period
    simnet.mineEmptyBlocks(VOTING_DELAY + VOTING_PERIOD);
    const setupReceipt2 = simnet.callPublicFn(
      contractAddress,
      "veto-action-proposal",
      [Cl.uint(1)],
      deployer
    );
    expect(setupReceipt2.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "veto-action-proposal",
      [Cl.uint(1)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_ALREADY_VOTED));
  });

  it("veto-action-proposal() succeeds and records veto vote info", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // progress chain past voting delay and period
    simnet.mineEmptyBlocks(VOTING_DELAY + VOTING_PERIOD);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "veto-action-proposal",
      [Cl.uint(1)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });

  ////////////////////////////////////////
  // conclude-action-proposal() tests
  ////////////////////////////////////////

  it("conclude-action-proposal() fails if proposal not found", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-action-proposal",
      [Cl.uint(999), Cl.principal(actionContractAddress)],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND));
  });

  it("conclude-action-proposal() fails if action is not an extension in the dao", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // progress chain past voting delay
    simnet.mineEmptyBlocks(VOTING_DELAY);
    const setupReceipt2 = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    );
    expect(setupReceipt2.result).toBeOk(Cl.bool(true));
    // progress chain past voting period
    simnet.mineEmptyBlocks(VOTING_PERIOD + VOTING_DELAY);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-action-proposal",
      [Cl.uint(1), Cl.principal(`${deployer}.unknown-action`)],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_ACTION));
  });

  it("conclude-action-proposal() fails if proposal is already concluded", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    passActionProposal(
      "SEND_MESSAGE",
      Cl.stringUtf8("test"),
      deployer,
      deployer,
      [deployer]
    );
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-action-proposal",
      [Cl.uint(1), Cl.principal(actionContractAddress)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(
      Cl.uint(ErrCode.ERR_PROPOSAL_ALREADY_CONCLUDED)
    );
  });

  it("conclude-action-proposal() fails if proposal is in voting period", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // progress chain past voting delay
    simnet.mineEmptyBlocks(VOTING_DELAY);
    const setupReceipt2 = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    );
    expect(setupReceipt2.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-action-proposal",
      [Cl.uint(1), Cl.principal(actionContractAddress)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_VOTING_ACTIVE));
  });

  it("conclude-action-proposal() fails if proposal is in veto period", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // progress chain past voting delay and period
    simnet.mineEmptyBlocks(VOTING_DELAY + VOTING_PERIOD);
    const setupReceipt2 = simnet.callPublicFn(
      contractAddress,
      "veto-action-proposal",
      [Cl.uint(1)],
      deployer
    );
    expect(setupReceipt2.result).toBeOk(Cl.bool(true));
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-action-proposal",
      [Cl.uint(1), Cl.principal(actionContractAddress)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(
      Cl.uint(ErrCode.ERR_PROPOSAL_EXECUTION_DELAY)
    );
  });

  it("conclude-action-proposal() fails if provided action does not match proposal action", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // progress chain past voting delay and period
    simnet.mineEmptyBlocks(VOTING_DELAY);
    const setupReceipt2 = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    );
    expect(setupReceipt2.result).toBeOk(Cl.bool(true));
    // progress chain past voting period and veto delay
    simnet.mineEmptyBlocks(VOTING_PERIOD + VOTING_DELAY);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-action-proposal",
      [Cl.uint(1), Cl.principal(`${deployer}.unknown-action`)],
      deployer
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_ACTION));
  });

  it("conclude-action-proposal() succeeds and executes the action if all criteria are met", () => {
    // arrange
    completePrelaunch(deployer);
    constructDao(deployer);
    fundVoters([deployer, address1, address2, address3]);
    const setupReceipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        formatSerializedBuffer(Cl.stringUtf8("test")),
        Cl.none(),
      ],
      deployer
    ).result;
    expect(setupReceipt).toBeOk(Cl.bool(true));
    // progress chain past voting delay
    simnet.mineEmptyBlocks(VOTING_DELAY);
    // pass proposal with multiple votes
    const voteReceipt1 = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    ).result;
    expect(voteReceipt1).toBeOk(Cl.bool(true));
    const voteReceipt2 = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      address1
    ).result;
    expect(voteReceipt2).toBeOk(Cl.bool(true));
    const voteReceipt3 = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      address2
    ).result;
    expect(voteReceipt3).toBeOk(Cl.bool(true));
    const voteReceipt4 = simnet.callPublicFn(
      contractAddress,
      "vote-on-action-proposal",
      [Cl.uint(1), Cl.bool(true)],
      address3
    ).result;
    expect(voteReceipt4).toBeOk(Cl.bool(true));
    // progress chain past voting period and veto delay
    simnet.mineEmptyBlocks(VOTING_PERIOD + VOTING_DELAY);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "conclude-action-proposal",
      [Cl.uint(1), Cl.principal(actionContractAddress)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-voting-power() tests
  ////////////////////////////////////////
  it("get-voting-power() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-voting-power",
      [Cl.uint(1), Cl.principal(address1)],
      deployer
    ).result;
    // assert
    expect(result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND));
  });

  ////////////////////////////////////////
  // get-proposal() tests
  ////////////////////////////////////////
  it("get-proposal() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-proposal",
      [Cl.uint(1)],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });

  ////////////////////////////////////////
  // get-vote-record() tests
  ////////////////////////////////////////
  it("get-vote-record() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-vote-record",
      [Cl.uint(1), Cl.principal(address1)],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });

  ////////////////////////////////////////
  // get-veto-vote-record() tests
  ////////////////////////////////////////
  it("get-veto-vote-record() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-veto-vote-record",
      [Cl.uint(1), Cl.principal(address1)],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });

  ////////////////////////////////////////
  // get-vote-records() tests
  ////////////////////////////////////////
  it("get-vote-records() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-vote-records",
      [Cl.uint(1), Cl.principal(address1)],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(
      Cl.tuple({
        voteRecord: Cl.none(),
        vetoVoteRecord: Cl.none(),
      })
    );
  });

  ////////////////////////////////////////
  // get-total-proposals() tests
  ////////////////////////////////////////
  it("get-total-proposals() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-proposals",
      [],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(
      Cl.tuple({
        proposalCount: Cl.uint(0),
        concludedProposalCount: Cl.uint(0),
        executedProposalCount: Cl.uint(0),
        lastProposalStacksBlock: Cl.uint(4), // deployed block
        lastProposalBitcoinBlock: Cl.uint(4), // deployed block
      })
    );
  });

  ////////////////////////////////////////
  // get-voting-configuration() tests
  ////////////////////////////////////////
  it("get-voting-configuration() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-voting-configuration",
      [],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(
      Cl.tuple({
        self: Cl.principal(contractAddress),
        deployedBitcoinBlock: Cl.uint(4),
        deployedStacksBlock: Cl.uint(4),
        delay: Cl.uint(144),
        period: Cl.uint(288),
        quorum: Cl.uint(15),
        threshold: Cl.uint(66),
        treasury: Cl.principal(treasuryContractAddress),
        proposalBond: Cl.uint(50000000000),
        proposalReward: Cl.uint(100000000000),
      })
    );
  });

  ////////////////////////////////////////
  // get-liquid-supply() tests
  ////////////////////////////////////////
  it("get-liquid-supply() returns expected value", () => {
    // arrange
    completePrelaunch(deployer);
    const expectedLiquidSupply = 20000000000000000n;
    fundVoters([deployer]);
    constructDao(deployer);
    simnet.mineEmptyBlocks(10);
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-liquid-supply",
      [Cl.uint(simnet.blockHeight - 1)],
      deployer
    ).result;
    // assert
    expect(result).toBeOk(Cl.uint(expectedLiquidSupply));
  });
});
