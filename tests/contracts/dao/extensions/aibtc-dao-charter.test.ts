import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeDaoCharter } from "../../../../utilities/contract-error-codes";
import { setupDaoContractRegistry } from "../../../../utilities/contract-registry";
import { constructDao } from "../../../../utilities/dao-helpers";

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

const expectedDaoCharterVersion = Cl.uint(1);
const expectedDaoCharterString = Cl.stringUtf8("aibtc mission goes here");
const expectedDaoCharter = Cl.tuple({
  burnHeight: Cl.uint(4), // deployed btc block height
  caller: Cl.principal(intializeDaoAddress),
  charter: expectedDaoCharterString,
  createdAt: Cl.uint(6), // deployed stx block height
  sender: Cl.principal(baseDaoContractAddress),
});

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
  // set-dao-charter() tests
  ////////////////////////////////////////
  describe("set-dao-charter()", () => {
    it("fails if called directly by a user", () => {
      // arrange
      // act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-dao-charter",
        [Cl.stringUtf8("Test Charter")],
        address1
      );
      // assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
    });
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-current-dao-charter-version() tests
  ////////////////////////////////////////
  it("get-current-dao-charter-version() returns none before initialized", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-current-dao-charter-version",
      [],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });
  it("get-current-dao-charter-version() returns expected value", () => {
    // arrange
    constructDao(deployer);
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-current-dao-charter-version",
      [],
      deployer
    ).result;
    // assert
    expect(result).toBeSome(expectedDaoCharterVersion);
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
});
