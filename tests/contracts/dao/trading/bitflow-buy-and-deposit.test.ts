import { Cl, ClarityType } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeBitflowSwapAdapter } from "../../../utilities/contract-error-codes";
import { setupFullContractRegistry } from "../../../utilities/contract-registry";
import { convertClarityTuple, SBTC_CONTRACT } from "../../../utilities/contract-helpers";
import { dbgLog } from "../../../utilities/debug-logging";
import { getSbtcFromFaucet, fundAgentAccount, graduateDex, enablePublicPoolCreation } from "../../../utilities/dao-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!; // user without agent
const address2 = accounts.get("wallet_2")!; // user with agent

// setup contract info for tests
const registry = setupFullContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype("TRADING", "BITFLOW_BUY_AND_DEPOSIT");
const agentAccountAddress = registry.getContractAddressByTypeAndSubtype("AGENT", "AGENT_ACCOUNT");
const daoTokenAddress = registry.getContractAddressByTypeAndSubtype("TOKEN", "DAO");

// import error codes
const ErrCode = ErrCodeBitflowSwapAdapter;

describe(`public functions: ${contractAddress.split(".")[1]}`, () => {
  beforeEach(() => {
    // Ensure dex is graduated and pool is created
    graduateDex(deployer);
    enablePublicPoolCreation(deployer);
    simnet.mineEmptyBlocks(10);
  });

  it("buy-and-deposit succeeds without agent account", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 100000; // 0.001 sBTC
    const minReceive = 5000000000; // example min

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [Cl.principal(daoTokenAddress), Cl.uint(amount), Cl.some(Cl.uint(minReceive))],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.uint(expect.any(Number)));
  });

  it("buy-and-deposit succeeds with agent account", () => {
    // arrange
    getSbtcFromFaucet(address2);
    fundAgentAccount(agentAccountAddress, address2);
    const amount = 100000;
    const minReceive = 5000000000;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [Cl.principal(daoTokenAddress), Cl.uint(amount), Cl.some(Cl.uint(minReceive))],
      address2
    );

    // assert
    expect(receipt.result).toBeOk(Cl.uint(expect.any(Number)));
    // Verify transfer to agent
  });

  it("buy-and-deposit fails with slippage too high", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 100000;
    const minReceive = 100000000000; // too high

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [Cl.principal(daoTokenAddress), Cl.uint(amount), Cl.some(Cl.uint(minReceive))],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_SLIPPAGE_TOO_HIGH));
  });

  it("buy-and-deposit fails without minReceive", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 100000;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [Cl.principal(daoTokenAddress), Cl.uint(amount), Cl.none()],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_MIN_RECEIVE_REQUIRED));
  });
});

describe(`read-only functions: ${contractAddress.split(".")[1]}`, () => {
  it("get-contract-info returns correct info", () => {
    // act
    const info = simnet.callReadOnlyFn(
      contractAddress,
      "get-contract-info",
      [],
      deployer
    );

    // assert
    expect(info.result.type).toBe(ClarityType.Tuple);
    // Add specific assertions
  });
});
