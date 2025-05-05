import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeTreasury } from "../../utilities/contract-error-codes";
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
  "TREASURY"
);
const contractName = contractAddress.split(".")[1];
const baseDaoContractAddress = registry.getContractAddressByTypeAndSubtype(
  "BASE",
  "DAO"
);

// import error codes
const ErrCode = ErrCodeTreasury;

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
  // transfer-stx() tests
  ////////////////////////////////////////
  it("transfer-stx() fails if called directly", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "transfer-stx",
    //   [/* parameters */],
    //   address1
    // );
    
    // assert
    // expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });

  it("transfer-stx() succeeds if called by the DAO", () => {
    // arrange
    // constructDao(deployer);
    
    // act
    // const receipt = simnet.callPublicFn(
    //   baseDaoContractAddress,
    //   "request-extension-callback",
    //   [
    //     Cl.principal(contractAddress),
    //     Cl.buffer(Cl.serialize(/* parameters */))
    //   ],
    //   deployer
    // );
    
    // assert
    // expect(receipt.result).toBeOk(Cl.bool(true));
  });

  ////////////////////////////////////////
  // transfer-ft() tests
  ////////////////////////////////////////
  it("transfer-ft() fails if called directly", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "transfer-ft",
    //   [/* parameters */],
    //   address1
    // );
    
    // assert
    // expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });

  ////////////////////////////////////////
  // transfer-nft() tests
  ////////////////////////////////////////
  it("transfer-nft() fails if called directly", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "transfer-nft",
    //   [/* parameters */],
    //   address1
    // );
    
    // assert
    // expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-balance() tests
  ////////////////////////////////////////
  it("get-balance() returns expected value", () => {
    // arrange
    // constructDao(deployer);
    
    // act
    // const result = simnet.callReadOnlyFn(
    //   contractAddress,
    //   "get-balance",
    //   [],
    //   deployer
    // ).result;
    
    // assert
    // expect(result).toStrictEqual(/* expected value */);
  });

  ////////////////////////////////////////
  // get-ft-balance() tests
  ////////////////////////////////////////
  it("get-ft-balance() returns expected value", () => {
    // arrange
    
    // act
    // const result = simnet.callReadOnlyFn(
    //   contractAddress,
    //   "get-ft-balance",
    //   [/* parameters */],
    //   deployer
    // ).result;
    
    // assert
    // expect(result).toStrictEqual(/* expected value */);
  });
});
