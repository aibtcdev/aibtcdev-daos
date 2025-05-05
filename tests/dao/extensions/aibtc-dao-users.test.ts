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
  // set-user-data() tests
  ////////////////////////////////////////
  it("set-user-data() fails if called directly", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "set-user-data",
    //   [/* parameters */],
    //   address1
    // );
    
    // assert
    // expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });

  it("set-user-data() succeeds if called by the DAO", () => {
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
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-user-data() tests
  ////////////////////////////////////////
  it("get-user-data() returns expected value", () => {
    // arrange
    // constructDao(deployer);
    
    // act
    // const result = simnet.callReadOnlyFn(
    //   contractAddress,
    //   "get-user-data",
    //   [/* parameters */],
    //   deployer
    // ).result;
    
    // assert
    // expect(result).toStrictEqual(/* expected value */);
  });
});
