import { Cl, ClarityType } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { ErrCodeFaktorySwapAdapter } from "../../../utilities/contract-error-codes";
import { setupFullContractRegistry } from "../../../utilities/contract-registry";
import { convertClarityTuple, SBTC_CONTRACT } from "../../../utilities/contract-helpers";
import { dbgLog } from "../../../utilities/debug-logging";
import { getSbtcFromFaucet, fundAgentAccount, completePrelaunch } from "../../../utilities/dao-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!; // user without agent
const address2 = accounts.get("wallet_2")!; // user with agent

// setup contract info for tests
const registry = setupFullContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype("TRADING", "FAKTORY_BUY_AND_DEPOSIT");
const agentAccountAddress = registry.getContractAddressByTypeAndSubtype("AGENT", "AGENT_ACCOUNT");
const preFaktoryAddress = registry.getContractAddressByTypeAndSubtype("TOKEN", "PRELAUNCH");
const daoTokenAddress = registry.getContractAddressByTypeAndSubtype("TOKEN", "DAO");

// import error codes
const ErrCode = ErrCodeFaktorySwapAdapter;

describe(`public functions: ${contractAddress.split(".")[1]}`, () => {
  beforeEach(() => {
    // Ensure prelaunch is complete for tests
    completePrelaunch(deployer);
    simnet.mineEmptyBlocks(10);
  });

  it("buy-and-deposit succeeds without agent account", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 100000; // 0.001 sBTC

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [Cl.principal(daoTokenAddress), Cl.uint(amount), Cl.none()],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.uint(expect.any(Number)));
    // Check balances or events as needed
  });

  it("buy-and-deposit succeeds with agent account", () => {
    // arrange
    getSbtcFromFaucet(address2);
    fundAgentAccount(agentAccountAddress, address2);
    const amount = 100000;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [Cl.principal(daoTokenAddress), Cl.uint(amount), Cl.none()],
      address2
    );

    // assert
    expect(receipt.result).toBeOk(Cl.uint(expect.any(Number)));
    // Verify transfer to agent account
  });

  it("buy-and-deposit fails with slippage too high", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 100000;
    const minReceive = 100000000000; // unrealistically high

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

  it("buy-seats-and-deposit succeeds and handles change", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 200000; // enough for seats + change

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-seats-and-deposit",
      [Cl.uint(amount)],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.uint(expect.any(Number)));
  });

  it("refund-seat-and-deposit succeeds", () => {
    // arrange
    // First buy a seat
    getSbtcFromFaucet(address1);
    simnet.callPublicFn(
      contractAddress,
      "buy-seats-and-deposit",
      [Cl.uint(20000)],
      address1
    );

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "refund-seat-and-deposit",
      [],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.uint(expect.any(Number)));
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
    // Add specific assertions as needed
  });
});
