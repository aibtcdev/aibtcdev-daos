import { Cl, cvToValue } from "@stacks/transactions";
import { beforeEach, describe, expect, it } from "vitest";
import { ErrCodeDaoUsers } from "../../../../utilities/contract-error-codes";
import { setupDaoContractRegistry } from "../../../../utilities/contract-registry";
import { constructDao, fundVoters } from "../../../../utilities/dao-helpers";

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
const daoAddress = registry.getContractAddress("aibtc-base-dao", deployer);

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
    fundVoters([deployer]);
    constructDao(deployer);
  });

  it("get-or-create-user-index() can create a user when called by the DAO", () => {
    // act
    const createReceipt = simnet.callPublicFn(
      contractAddress,
      "get-or-create-user-index",
      [Cl.principal(address1)],
      daoAddress
    );

    // assert
    expect(createReceipt.result).toBeOk(Cl.uint(1));
    expect(
      simnet.callReadOnlyFn(contractAddress, "get-user-count", [], deployer)
        .result
    ).toStrictEqual(Cl.uint(1));

    const userData = simnet.callReadOnlyFn(
      contractAddress,
      "get-user-data-by-address",
      [Cl.principal(address1)],
      deployer
    ).result;

    expect(userData).toSatisfy((r: any) => r.value.data.address.value === address1);
    expect(userData).toSatisfy((r: any) => r.value.data.reputation.value === 0n);
    expect(userData).toSatisfy((r: any) => r.value.data.createdAt.value > 0n);
  });

  it("increase-user-reputation() updates reputation and preserves createdAt", () => {
    // arrange: create user
    simnet.callPublicFn(
      contractAddress,
      "get-or-create-user-index",
      [Cl.principal(address1)],
      daoAddress
    );
    const originalUserData = cvToValue(
      simnet.callReadOnlyFn(
        contractAddress,
        "get-user-data-by-address",
        [Cl.principal(address1)],
        deployer
      ).result
    );

    // act: increase reputation
    const increaseReceipt = simnet.callPublicFn(
      contractAddress,
      "increase-user-reputation",
      [Cl.principal(address1), Cl.uint(100)],
      daoAddress
    );

    // assert
    expect(increaseReceipt.result).toBeOk(Cl.bool(true));
    const updatedUserData = cvToValue(
      simnet.callReadOnlyFn(
        contractAddress,
        "get-user-data-by-address",
        [Cl.principal(address1)],
        deployer
      ).result
    );
    expect(updatedUserData.reputation).toBe(100n);
    expect(updatedUserData.createdAt).toBe(originalUserData.createdAt);
  });

  it("decrease-user-reputation() updates reputation and preserves createdAt", () => {
    // arrange: create user and set initial reputation
    simnet.callPublicFn(
      contractAddress,
      "get-or-create-user-index",
      [Cl.principal(address1)],
      daoAddress
    );
    simnet.callPublicFn(
      contractAddress,
      "increase-user-reputation",
      [Cl.principal(address1), Cl.uint(100)],
      daoAddress
    );
    const originalUserData = cvToValue(
      simnet.callReadOnlyFn(
        contractAddress,
        "get-user-data-by-address",
        [Cl.principal(address1)],
        deployer
      ).result
    );
    expect(originalUserData.reputation).toBe(100n);

    // act: decrease reputation
    const decreaseReceipt = simnet.callPublicFn(
      contractAddress,
      "decrease-user-reputation",
      [Cl.principal(address1), Cl.uint(30)],
      daoAddress
    );

    // assert
    expect(decreaseReceipt.result).toBeOk(Cl.bool(true));
    const updatedUserData = cvToValue(
      simnet.callReadOnlyFn(
        contractAddress,
        "get-user-data-by-address",
        [Cl.principal(address1)],
        deployer
      ).result
    );
    expect(updatedUserData.reputation).toBe(70n);
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
