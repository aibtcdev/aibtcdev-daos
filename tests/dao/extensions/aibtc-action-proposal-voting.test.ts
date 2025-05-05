import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeActionProposalVoting } from "../../utilities/contract-error-codes";
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
  "ACTION_PROPOSAL_VOTING"
);
const contractName = contractAddress.split(".")[1];
const baseDaoContractAddress = registry.getContractAddressByTypeAndSubtype(
  "BASE",
  "DAO"
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
  // propose() tests
  ////////////////////////////////////////
  it("propose() fails if called directly", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "propose",
    //   [/* parameters */],
    //   address1
    // );
    
    // assert
    // expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });

  it("propose() succeeds if called by the DAO", () => {
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
  // vote() tests
  ////////////////////////////////////////
  it("vote() fails if called directly", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "vote",
    //   [/* parameters */],
    //   address1
    // );
    
    // assert
    // expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });

  ////////////////////////////////////////
  // conclude() tests
  ////////////////////////////////////////
  it("conclude() fails if called directly", () => {
    // arrange
    
    // act
    // const receipt = simnet.callPublicFn(
    //   contractAddress,
    //   "conclude",
    //   [/* parameters */],
    //   address1
    // );
    
    // assert
    // expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-proposal-by-id() tests
  ////////////////////////////////////////
  it("get-proposal-by-id() returns expected value", () => {
    // arrange
    // constructDao(deployer);
    
    // act
    // const result = simnet.callReadOnlyFn(
    //   contractAddress,
    //   "get-proposal-by-id",
    //   [/* parameters */],
    //   deployer
    // ).result;
    
    // assert
    // expect(result).toStrictEqual(/* expected value */);
  });

  ////////////////////////////////////////
  // get-vote-by-voter-and-proposal-id() tests
  ////////////////////////////////////////
  it("get-vote-by-voter-and-proposal-id() returns expected value", () => {
    // arrange
    
    // act
    // const result = simnet.callReadOnlyFn(
    //   contractAddress,
    //   "get-vote-by-voter-and-proposal-id",
    //   [/* parameters */],
    //   deployer
    // ).result;
    
    // assert
    // expect(result).toStrictEqual(/* expected value */);
  });
});
