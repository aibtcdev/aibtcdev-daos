import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeDaoUsers } from "../../utilities/contract-error-codes";
import { setupDaoContractRegistry } from "../../utilities/contract-registry";
import { constructDao } from "../../utilities/dao-helpers";

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
  "DAO_USERS"
);
const contractName = contractAddress.split(".")[1];
const baseDaoContractAddress = registry.getContractAddressByTypeAndSubtype(
  "BASE",
  "DAO"
);

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
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
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
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
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
    expect(result).toStrictEqual(Cl.uint(0)); // or appropriate value
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
    expect(result).toBeNone(); // or appropriate value
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
    expect(result).toBeNone(); // or appropriate value
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
    expect(result).toBeNone(); // or appropriate value
  });
});
