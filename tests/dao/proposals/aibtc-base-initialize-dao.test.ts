import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeBaseDao } from "../../utilities/contract-error-codes";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

const contractName = "aibtc-base-initialize-dao";
const contractAddress = `${deployer}.${contractName}`;

// first call to baes dao fails
const expectedErr = Cl.uint(ErrCodeBaseDao.ERR_UNAUTHORIZED);

describe(`public functions: ${contractName}`, () => {
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
