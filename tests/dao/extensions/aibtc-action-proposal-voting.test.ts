import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeActionProposalVoting } from "../../utilities/contract-error-codes";
import { setupDaoContractRegistry } from "../../utilities/contract-registry";
import { constructDao, fundVoters } from "../../utilities/dao-helpers";

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
  // create-action-proposal() tests
  ////////////////////////////////////////
  it("create-action-proposal() fails with insufficient balance", () => {
    // arrange
    constructDao(deployer);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        Cl.buffer(Cl.serialize(Cl.stringAscii("test"))),
        Cl.none(),
      ],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INSUFFICIENT_BALANCE));
  });

  it("create-action-proposal() succeeds if called with sufficient balance", () => {
    // arrange
    fundVoters([deployer]);
    constructDao(deployer);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "create-action-proposal",
      [
        Cl.principal(actionContractAddress),
        Cl.buffer(Cl.serialize(Cl.stringAscii("test"))),
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
    expect(result).toBeErr(Cl.uint(ErrCode.ERR_PROPOSAL_NOT_FOUND)); // or appropriate value
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
    expect(result).toBeNone(); // or appropriate value
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
    expect(result).toBeNone(); // or appropriate value
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
    expect(result).toBeNone(); // or appropriate value
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
    ); // or appropriate value
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
    ); // or appropriate value
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
        proposalBond: Cl.uint(500000000000),
        proposalReward: Cl.uint(100000000000),
      })
    ); // or appropriate value
  });

  ////////////////////////////////////////
  // get-liquid-supply() tests
  ////////////////////////////////////////
  it("get-liquid-supply() returns expected value", () => {
    // arrange
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
    expect(result).toBeOk(Cl.uint(expectedLiquidSupply)); // or appropriate value
  });
});
