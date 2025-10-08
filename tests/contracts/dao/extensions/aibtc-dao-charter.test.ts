import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeDaoCharter } from "../../../../utilities/contract-error-codes";
import { setupDaoContractRegistry } from "../../../../utilities/contract-registry";
import {
  constructDao,
  DAO_CHARTER_MESSAGE,
} from "../../../../utilities/dao-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;

// setup contract info for tests
const registry = setupDaoContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "EXTENSIONS",
  "DAO_CHARTER"
);
const contractName = contractAddress.split(".")[1];
const baseDaoContractAddress = registry.getContractAddressByTypeAndSubtype(
  "BASE",
  "DAO"
);
const intializeDaoAddress = registry.getContractAddressByTypeAndSubtype(
  "PROPOSALS",
  "INITIALIZE_DAO"
);

// import error codes
const ErrCode = ErrCodeDaoCharter;

const expectedDaoCharterIndex = Cl.uint(1);
const expectedDaoCharterString = Cl.stringUtf8(DAO_CHARTER_MESSAGE);
const expectedDaoCharter = Cl.tuple({
  burnHeight: Cl.uint(simnet.burnBlockHeight), // deployed btc block height
  caller: Cl.principal(intializeDaoAddress),
  charter: expectedDaoCharterString,
  createdAt: Cl.uint(simnet.stacksBlockHeight + 1), // deployed stx block height
  sender: Cl.principal(baseDaoContractAddress),
});

const expectedDaoMonarchIndex = Cl.uint(2);
const expectedNewMonarch = Cl.principal(deployer);
const expectedDaoMonarch = Cl.tuple({
  burnHeight: Cl.uint(simnet.burnBlockHeight),
  createdAt: Cl.uint(simnet.stacksBlockHeight + 1),
  caller: Cl.principal(baseDaoContractAddress),
  sender: Cl.principal(baseDaoContractAddress),
  previousMonarch: Cl.principal(baseDaoContractAddress),
  newMonarch: expectedNewMonarch,
});

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
  // set-dao-charter() tests
  ////////////////////////////////////////
  describe("set-dao-charter()", () => {
    it("fails if called directly by a user", () => {
      // arrange
      // act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-dao-charter",
        [Cl.stringUtf8(DAO_CHARTER_MESSAGE)],
        address1
      );
      // assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_AUTHORIZED));
    });
  });

  ////////////////////////////////////////
  // set-dao-monarch() tests
  ////////////////////////////////////////
  describe("set-dao-monarch()", () => {
    it("fails if called directly by a user", () => {
      // arrange
      // act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-dao-monarch",
        [Cl.principal(address1)],
        address1
      );
      // assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_AUTHORIZED));
    });
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-current-dao-charter-index() tests
  ////////////////////////////////////////
  it("get-current-dao-charter-index() returns none before initialized", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-current-dao-charter-index",
      [],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });
  it("get-current-dao-charter-index() returns expected value", () => {
    // arrange
    constructDao(deployer);
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-current-dao-charter-index",
      [],
      deployer
    ).result;
    // assert
    expect(result).toBeSome(expectedDaoCharterIndex);
  });

  ////////////////////////////////////////
  // get-current-dao-charter() tests
  ////////////////////////////////////////
  it("get-current-dao-charter() returns none before initialized", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-current-dao-charter",
      [],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });
  it("get-current-dao-charter() returns expected value", () => {
    // arrange
    constructDao(deployer);
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-current-dao-charter",
      [],
      deployer
    ).result;
    // assert
    expect(result).toBeSome(expectedDaoCharter);
  });

  ////////////////////////////////////////
  // get-dao-charter() tests
  ////////////////////////////////////////
  it("get-dao-charter() returns none before initialized", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-dao-charter",
      [Cl.uint(1)],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });
  it("get-dao-charter() returns expected value", () => {
    // arrange
    constructDao(deployer);
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-dao-charter",
      [Cl.uint(1)],
      deployer
    ).result;
    // assert
    expect(result).toBeSome(expectedDaoCharter);
  });

  ////////////////////////////////////////
  // get-current-dao-monarch-index() tests
  ////////////////////////////////////////
  it("get-current-dao-monarch-index() returns none before initialized", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-current-dao-monarch-index",
      [],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });
  it("get-current-dao-monarch-index() returns expected value", () => {
    // arrange
    constructDao(deployer);
    simnet.callPublicFn(
      contractAddress,
      "set-dao-monarch",
      [expectedNewMonarch],
      deployer
    );
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-current-dao-monarch-index",
      [],
      deployer
    ).result;
    // assert
    expect(result).toBeSome(expectedDaoMonarchIndex);
  });

  ////////////////////////////////////////
  // get-current-dao-monarch() tests
  ////////////////////////////////////////
  it("get-current-dao-monarch() returns none before initialized", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-current-dao-monarch",
      [],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });
  it("get-current-dao-monarch() returns expected value", () => {
    // arrange
    constructDao(deployer);
    simnet.callPublicFn(
      contractAddress,
      "set-dao-monarch",
      [expectedNewMonarch],
      deployer
    );
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-current-dao-monarch",
      [],
      deployer
    ).result;
    // assert
    expect(result).toBeSome(expectedDaoMonarch);
  });

  ////////////////////////////////////////
  // get-dao-monarch() tests
  ////////////////////////////////////////
  it("get-dao-monarch() returns none before initialized", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-dao-monarch",
      [Cl.uint(1)],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });
  it("get-dao-monarch() returns expected value", () => {
    // arrange
    constructDao(deployer);
    simnet.callPublicFn(
      contractAddress,
      "set-dao-monarch",
      [expectedNewMonarch],
      deployer
    );
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-dao-monarch",
      [Cl.uint(1)],
      deployer
    ).result;
    // assert
    expect(result).toBeSome(expectedDaoMonarch);
  });
});
