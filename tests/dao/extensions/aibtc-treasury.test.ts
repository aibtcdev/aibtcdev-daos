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
  // allow-asset() tests
  ////////////////////////////////////////
  it("allow-asset() fails if called directly", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "allow-asset",
      [Cl.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.token"), Cl.bool(true)],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });

  ////////////////////////////////////////
  // deposit-ft() tests
  ////////////////////////////////////////
  it("deposit-ft() fails if asset not allowed", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "deposit-ft",
      [
        Cl.contractPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", "token"),
        Cl.uint(100)
      ],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_ASSET_NOT_ALLOWED));
  });

  ////////////////////////////////////////
  // withdraw-ft() tests
  ////////////////////////////////////////
  it("withdraw-ft() fails if called directly", () => {
    // arrange
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "withdraw-ft",
      [
        Cl.contractPrincipal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", "token"),
        Cl.uint(100),
        Cl.principal(address1)
      ],
      address1
    );
    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_NOT_DAO_OR_EXTENSION));
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // is-allowed-asset() tests
  ////////////////////////////////////////
  it("is-allowed-asset() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "is-allowed-asset",
      [Cl.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.token")],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.bool(false)); // or appropriate value
  });

  ////////////////////////////////////////
  // get-allowed-asset() tests
  ////////////////////////////////////////
  it("get-allowed-asset() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-allowed-asset",
      [Cl.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.token")],
      deployer
    ).result;
    // assert
    expect(result).toBeNone(); // or appropriate value
  });

  ////////////////////////////////////////
  // get-contract-info() tests
  ////////////////////////////////////////
  it("get-contract-info() returns expected value", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-contract-info",
      [],
      deployer
    ).result;
    // assert
    expect(result).toStrictEqual(Cl.tuple({
      self: Cl.principal(contractAddress),
      deployedBurnBlock: Cl.uint(0), // or appropriate value
      deployedStacksBlock: Cl.uint(0) // or appropriate value
    }));
  });
});
