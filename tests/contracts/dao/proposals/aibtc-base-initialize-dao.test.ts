import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeBaseDao } from "../../../../utilities/contract-error-codes";
import { setupDaoContractRegistry } from "../../../../utilities/contract-registry";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

// setup contract info for tests
const registry = setupDaoContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "PROPOSALS",
  "INITIALIZE_DAO"
);
const contractName = contractAddress.split(".")[1];

// import error codes (first call to baes dao fails)
const expectedErr = Cl.uint(ErrCodeBaseDao.ERR_UNAUTHORIZED);

describe.skip(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // execute() tests
  ////////////////////////////////////////
  it("execute() fails if called directly", () => {
    const receipt = simnet.callPublicFn(
      contractAddress,
      "execute",
      [Cl.principal(deployer)],
      deployer
    );
    expect(receipt.result).toBeErr(expectedErr);
  });
});
