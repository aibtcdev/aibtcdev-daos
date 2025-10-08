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
const address2 = accounts.get("wallet_2")!;

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

    it("fails if called pre-init even by deployer", () => {
      // arrange
      // act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-dao-charter",
        [Cl.stringUtf8(DAO_CHARTER_MESSAGE)],
        deployer
      );
      // assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_AUTHORIZED));
      expect(simnet.callReadOnlyFn(contractAddress, "get-current-dao-charter-index", [], deployer).result).toBeNone();
    });

    it("succeeds when called by monarch after init", () => {
      // arrange
      const burnHeight = simnet.burnBlockHeight;
      const stacksHeight = simnet.stacksBlockHeight;
      constructDao(deployer);
      const newCharter = "New charter text";
      // act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-dao-charter",
        [Cl.stringUtf8(newCharter)],
        deployer
      );
      // assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      expect(receipt.events).toHaveLength(1);
      expect(receipt.events[0].type).toBe("print_event");
      expect(simnet.callReadOnlyFn(contractAddress, "get-current-dao-charter-index", [], deployer).result).toBeSome(Cl.uint(2));
      const currentCharter = simnet.callReadOnlyFn(contractAddress, "get-current-dao-charter", [], deployer).result;
      expect(currentCharter).toBeSome(Cl.tuple({
        burnHeight: Cl.uint(burnHeight),
        createdAt: Cl.uint(stacksHeight + 2),
        caller: Cl.principal(deployer),
        sender: Cl.principal(deployer),
        charter: Cl.stringUtf8(newCharter),
      }));
    });

    it("fails with charter too short", () => {
      // arrange
      constructDao(deployer);
      // act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-dao-charter",
        [Cl.stringUtf8("")],
        deployer
      );
      // assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CHARTER_TOO_SHORT));
    });

    it("fails with charter too long", () => {
      // arrange
      constructDao(deployer);
      const longCharter = "a".repeat(16385);
      // act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-dao-charter",
        [Cl.stringUtf8(longCharter)],
        deployer
      );
      // assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_CHARTER_TOO_LONG));
    });

    it("handles multiple charter updates in sequence", () => {
      // arrange
      constructDao(deployer);
      const charter1 = "Charter v2";
      const charter2 = "Charter v3";
      // act
      simnet.callPublicFn(contractAddress, "set-dao-charter", [Cl.stringUtf8(charter1)], deployer);
      simnet.callPublicFn(contractAddress, "set-dao-charter", [Cl.stringUtf8(charter2)], deployer);
      // assert
      expect(simnet.callReadOnlyFn(contractAddress, "get-current-dao-charter-index", [], deployer).result).toBeSome(Cl.uint(3));
      const oldCharter = simnet.callReadOnlyFn(contractAddress, "get-dao-charter", [Cl.uint(2)], deployer).result;
      expect(oldCharter).toBeSome(Cl.tuple({ charter: Cl.stringUtf8(charter1) }));
      const currentCharter = simnet.callReadOnlyFn(contractAddress, "get-current-dao-charter", [], deployer).result;
      expect(currentCharter).toBeSome(Cl.tuple({ charter: Cl.stringUtf8(charter2) }));
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

    it("fails if called pre-init even by deployer", () => {
      // arrange
      // act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-dao-monarch",
        [Cl.principal(deployer)],
        deployer
      );
      // assert
      expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_AUTHORIZED));
      expect(simnet.callReadOnlyFn(contractAddress, "get-current-dao-monarch-index", [], deployer).result).toBeNone();
    });

    it("succeeds when called by monarch after init (self-update)", () => {
      // arrange
      const burnHeight = simnet.burnBlockHeight;
      const stacksHeight = simnet.stacksBlockHeight;
      constructDao(deployer);
      // act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-dao-monarch",
        [Cl.principal(deployer)],
        deployer
      );
      // assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      expect(receipt.events).toHaveLength(1);
      expect(receipt.events[0].type).toBe("print_event");
      expect(simnet.callReadOnlyFn(contractAddress, "get-current-dao-monarch-index", [], deployer).result).toBeSome(Cl.uint(2));
      const currentMonarch = simnet.callReadOnlyFn(contractAddress, "get-current-dao-monarch", [], deployer).result;
      expect(currentMonarch).toBeSome(Cl.tuple({
        burnHeight: Cl.uint(burnHeight),
        createdAt: Cl.uint(stacksHeight + 2),
        caller: Cl.principal(deployer),
        sender: Cl.principal(deployer),
        previousMonarch: Cl.principal(deployer),
        newMonarch: Cl.principal(deployer),
      }));
    });

    it("handles multiple monarch updates in sequence", () => {
      // arrange
      constructDao(deployer);
      // act
      simnet.callPublicFn(contractAddress, "set-dao-monarch", [Cl.principal(address1)], deployer);
      simnet.callPublicFn(contractAddress, "set-dao-monarch", [Cl.principal(address2)], address1);
      // assert
      expect(simnet.callReadOnlyFn(contractAddress, "get-current-dao-monarch-index", [], deployer).result).toBeSome(Cl.uint(3));
      const oldMonarch = simnet.callReadOnlyFn(contractAddress, "get-dao-monarch", [Cl.uint(2)], deployer).result;
      expect(oldMonarch).toBeSome(Cl.tuple({ newMonarch: Cl.principal(address1) }));
      const currentMonarch = simnet.callReadOnlyFn(contractAddress, "get-current-dao-monarch", [], deployer).result;
      expect(currentMonarch).toBeSome(Cl.tuple({ previousMonarch: Cl.principal(address1), newMonarch: Cl.principal(address2) }));
    });

    it("sets first monarch post-init with default previous", () => {
      // arrange
      constructDao(deployer);
      simnet.callPublicFn(contractAddress, "set-dao-monarch", [Cl.principal(contractAddress)], deployer); // Set to something else
      simnet.callPublicFn(contractAddress, "set-dao-monarch", [Cl.principal(deployer)], contractAddress); // Reset
      simnet.setDataVar(contractAddress, "currentMonarchIndex", Cl.uint(0)); // Simulate reset for edge case
      // act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-dao-monarch",
        [Cl.principal(address1)],
        deployer
      );
      // assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      const currentMonarch = simnet.callReadOnlyFn(contractAddress, "get-current-dao-monarch", [], deployer).result;
      expect(currentMonarch).toBeSome(Cl.tuple({ previousMonarch: Cl.principal(deployer) })); // tx-sender as default
    });

    it("allows setting monarch to contract itself", () => {
      // arrange
      constructDao(deployer);
      // act
      const receipt = simnet.callPublicFn(
        contractAddress,
        "set-dao-monarch",
        [Cl.principal(contractAddress)],
        deployer
      );
      // assert
      expect(receipt.result).toBeOk(Cl.bool(true));
      const currentMonarch = simnet.callReadOnlyFn(contractAddress, "get-current-dao-monarch", [], deployer).result;
      expect(currentMonarch).toBeSome(Cl.tuple({ newMonarch: Cl.principal(contractAddress) }));
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
    const expectedDaoCharterIndex = Cl.uint(1);
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

  it("retrieves non-current charter version after multiple sets", () => {
    // arrange
    constructDao(deployer);
    simnet.callPublicFn(contractAddress, "set-dao-charter", [Cl.stringUtf8("v2")], deployer);
    // act
    const oldCharter = simnet.callReadOnlyFn(contractAddress, "get-dao-charter", [Cl.uint(1)], deployer).result;
    // assert
    expect(oldCharter).toBeSome(Cl.tuple({ charter: Cl.stringUtf8(DAO_CHARTER_MESSAGE) }));
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
    const burnHeight = simnet.burnBlockHeight;
    const stacksHeight = simnet.stacksBlockHeight;
    constructDao(deployer);
    const expectedDaoCharterString = Cl.stringUtf8(DAO_CHARTER_MESSAGE);
    const expectedDaoCharter = Cl.tuple({
      burnHeight: Cl.uint(burnHeight),
      createdAt: Cl.uint(stacksHeight + 1),
      caller: Cl.principal(intializeDaoAddress),
      sender: Cl.principal(baseDaoContractAddress),
      charter: expectedDaoCharterString,
    });
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
    const burnHeight = simnet.burnBlockHeight;
    const stacksHeight = simnet.stacksBlockHeight;
    constructDao(deployer);
    const expectedDaoCharterString = Cl.stringUtf8(DAO_CHARTER_MESSAGE);
    const expectedDaoCharter = Cl.tuple({
      burnHeight: Cl.uint(burnHeight),
      createdAt: Cl.uint(stacksHeight + 1),
      caller: Cl.principal(intializeDaoAddress),
      sender: Cl.principal(baseDaoContractAddress),
      charter: expectedDaoCharterString,
    });
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
    const expectedDaoMonarchIndex = Cl.uint(1);
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
    const burnHeight = simnet.burnBlockHeight;
    const stacksHeight = simnet.stacksBlockHeight;
    constructDao(deployer);
    const expectedNewMonarch = Cl.principal(deployer);
    const expectedDaoMonarch = Cl.tuple({
      burnHeight: Cl.uint(burnHeight),
      createdAt: Cl.uint(stacksHeight + 1),
      caller: Cl.principal(intializeDaoAddress),
      sender: Cl.principal(baseDaoContractAddress),
      previousMonarch: Cl.principal(baseDaoContractAddress),
      newMonarch: expectedNewMonarch,
    });
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
    const burnHeight = simnet.burnBlockHeight;
    const stacksHeight = simnet.stacksBlockHeight;
    constructDao(deployer);
    const expectedNewMonarch = Cl.principal(deployer);
    const expectedDaoMonarch = Cl.tuple({
      burnHeight: Cl.uint(burnHeight),
      createdAt: Cl.uint(stacksHeight + 1),
      caller: Cl.principal(intializeDaoAddress),
      sender: Cl.principal(baseDaoContractAddress),
      previousMonarch: Cl.principal(baseDaoContractAddress),
      newMonarch: expectedNewMonarch,
    });
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

describe(`integration tests: ${contractName}`, () => {
  it("allows new monarch to set charter after monarch change", () => {
    // arrange
    constructDao(deployer);
    simnet.callPublicFn(contractAddress, "set-dao-monarch", [Cl.principal(address1)], deployer);
    const newCharter = "Charter set by new monarch";
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-dao-charter",
      [Cl.stringUtf8(newCharter)],
      address1
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const currentCharter = simnet.callReadOnlyFn(contractAddress, "get-current-dao-charter", [], deployer).result;
    expect(currentCharter).toBeSome(Cl.tuple({ charter: Cl.stringUtf8(newCharter), sender: Cl.principal(address1) }));
  });
});
