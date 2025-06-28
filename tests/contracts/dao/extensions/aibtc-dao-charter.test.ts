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
        [Cl.stringUtf8("Test Charter")],
        address1
      );
      // assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
    });

    it("fails if charter is too short (empty string)", () => {
      // arrange
      constructDao(deployer);
      // act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-dao-charter",
        [Cl.stringUtf8("")],
        baseDaoContractAddress
      );
      // assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CHARTER_TOO_SHORT));
    });

    it("fails if charter is too long (> 4096 chars)", () => {
      // arrange
      constructDao(deployer);
      const longString = "a".repeat(4097);
      // act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-dao-charter",
        [Cl.stringUtf8(longString)],
        baseDaoContractAddress
      );
      // assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CHARTER_TOO_LONG));
    });

    it("succeeds, increments version, and logs previous charter on subsequent calls", () => {
      // arrange
      constructDao(deployer); // sets version 1
      const newCharterString = "aibtc new mission";

      // act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-dao-charter",
        [Cl.stringUtf8(newCharterString)],
        baseDaoContractAddress
      );

      // assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      expect(receipt.events).toHaveLength(1);
      const event = receipt.events[0];
      expect(event.event).toBe("print");
      const printEventData = event.data.data;
      expect(printEventData.notification.data).toBe(
        "aibtc-dao-charter/set-dao-charter"
      );
      const payload = printEventData.payload.data;
      expect(payload.version).toEqual(Cl.uint(2));
      expect(payload.charter).toEqual(Cl.stringUtf8(newCharterString));
      expect(payload.previousCharter).toEqual(expectedDaoCharterString);
      expect(payload.contractCaller).toEqual(
        Cl.principal(baseDaoContractAddress)
      );
      expect(payload.txSender).toEqual(Cl.principal(baseDaoContractAddress));

      // check new state
      const newVersion = simnet.callReadOnlyFn(
        contractAddress,
        "get-current-dao-charter-version",
        [],
        deployer
      ).result;
      expect(newVersion).toBeSome(Cl.uint(2));

      const newCharterDataResult = simnet.callReadOnlyFn(
        contractAddress,
        "get-current-dao-charter",
        [],
        deployer
      ).result;
      const newCharterData = (newCharterDataResult.value as any).data;
      expect(newCharterData.charter).toEqual(Cl.stringUtf8(newCharterString));
      expect(newCharterData.caller).toEqual(
        Cl.principal(baseDaoContractAddress)
      );
      expect(newCharterData.sender).toEqual(
        Cl.principal(baseDaoContractAddress)
      );
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
