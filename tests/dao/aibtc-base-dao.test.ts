import { bufferCVFromString, Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeBaseDao } from "../utilities/contract-error-codes";
import { constructDao } from "../utilities/dao-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;

const contractName = "aibtc-base-dao";
const contractAddress = `${deployer}.${contractName}`;
const treasuryContractAddress = `${deployer}.aibtc-treasury`;
const bootstrapContractAddress = `${deployer}.aibtc-base-initialize-dao`;

const ErrCode = ErrCodeBaseDao;

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // construct() tests
  ////////////////////////////////////////
  it("construct() fails if called by another address", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "construct",
      [Cl.principal(bootstrapContractAddress)],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("construct() succeeds if called by the deployer", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "construct",
      [Cl.principal(bootstrapContractAddress)],
      deployer
    );
    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
  });
  ////////////////////////////////////////
  // execute() tests
  ////////////////////////////////////////
  it("execute() fails if called directly", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "execute",
      [Cl.principal(bootstrapContractAddress), Cl.principal(address1)],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  ////////////////////////////////////////
  // set-extension() tests
  ////////////////////////////////////////
  it("set-extension() fails if called directly", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-extension",
      [Cl.principal(bootstrapContractAddress), Cl.bool(true)],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  ////////////////////////////////////////
  // set-extensions() tests
  ////////////////////////////////////////
  it("set-extensions() fails if called directly", () => {
    // arrange
    const extension = Cl.tuple({
      extension: Cl.principal(bootstrapContractAddress),
      enabled: Cl.bool(true),
    });
    const extensionList = Cl.list([extension]);
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "set-extensions",
      [extensionList],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  ////////////////////////////////////////
  // request-extension-callback() tests
  ////////////////////////////////////////
  it("request-extension-callback() fails if called directly", () => {
    // arrange
    const memo = bufferCVFromString("0x");
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "request-extension-callback",
      [Cl.principal(treasuryContractAddress), memo],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_EXTENSION));
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // is-constructed() tests
  ////////////////////////////////////////
  it("is-constructed() returns false before dao is constructed", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "is-constructed",
      [],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.bool(false));
  });
  it("is-constructed() returns true after dao is constructed", () => {
    // arrange
    constructDao(deployer, contractAddress, bootstrapContractAddress);
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "is-constructed",
      [],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.bool(true));
  });
  ////////////////////////////////////////
  // is-extension() tests
  ////////////////////////////////////////
  it("is-extension() returns false before dao is constructed", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "is-extension",
      [Cl.principal(treasuryContractAddress)],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.bool(false));
  });
  it("is-extension() returns true after dao is constructed", () => {
    // arrange
    constructDao(deployer, contractAddress, bootstrapContractAddress);
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "is-extension",
      [Cl.principal(treasuryContractAddress)],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.bool(true));
  });
  ////////////////////////////////////////
  // executed-at() tests
  ////////////////////////////////////////
  it("executed-at() returns none if the proposal was not executed", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "executed-at",
      [Cl.principal(bootstrapContractAddress)],
      deployer
    ).result;
    // assert
    expect(result).toBeNone();
  });
  it("executed-at() returns some blockheight if the proposal was executed", () => {
    // arrange
    const blockHeight = simnet.blockHeight + 1;
    constructDao(deployer, contractAddress, bootstrapContractAddress);
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "executed-at",
      [Cl.principal(bootstrapContractAddress)],
      deployer
    ).result;
    // assert
    expect(result).toBeSome(Cl.uint(blockHeight));
  });
});
