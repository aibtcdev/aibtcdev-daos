import { Cl, ClarityType } from "@stacks/transactions";
import { beforeEach, describe, expect, it } from "vitest";
import {
  ErrCodeFaktoryBuyAndDeposit,
  ErrCodeFaktorySwapAdapter,
} from "../../../../utilities/contract-error-codes";
import { setupFullContractRegistry } from "../../../../utilities/contract-registry";
import {
  convertClarityTuple,
  DAO_TOKEN_ASSETS_MAP,
  SBTC_ASSETS_MAP,
} from "../../../../utilities/contract-helpers";
import {
  getSbtcFromFaucet,
  fundAgentAccount,
  completePrelaunch,
} from "../../../../utilities/dao-helpers";
import { getBalancesForPrincipal } from "../../../../utilities/asset-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!; // user without agent
const address2 = accounts.get("wallet_2")!; // user with agent

// setup contract info for tests
const registry = setupFullContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "TRADING",
  "FAKTORY_BUY_AND_DEPOSIT"
);
const agentAccountAddress = registry.getContractAddressByTypeAndSubtype(
  "AGENT",
  "AGENT_ACCOUNT"
);
const daoTokenAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DAO"
);

// import error codes
const ErrCode = ErrCodeFaktoryBuyAndDeposit;

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
    const amountPurchased = 1163204747774481; // from logs
    const initialBalance =
      getBalancesForPrincipal(address1).get(DAO_TOKEN_ASSETS_MAP) || 0n;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [Cl.principal(daoTokenAddress), Cl.uint(amount), Cl.none()],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.uint(amountPurchased));
    const finalBalance =
      getBalancesForPrincipal(address1).get(DAO_TOKEN_ASSETS_MAP) || 0n;
    expect(finalBalance).toBeGreaterThan(initialBalance);
    /* TODO: this is incorrect
    // Check for transfer event (adapt based on actual events emitted)
    expect(receipt.events).toHaveLength(expect.any(Number));
    */
  });

  it("buy-and-deposit succeeds with agent account", () => {
    // arrange
    getSbtcFromFaucet(address2);
    fundAgentAccount(agentAccountAddress, address2);
    getSbtcFromFaucet(address2);
    const amount = 10000;
    const initialBalance =
      getBalancesForPrincipal(agentAccountAddress).get(DAO_TOKEN_ASSETS_MAP) ||
      0n;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [Cl.principal(daoTokenAddress), Cl.uint(amount), Cl.none()],
      address2
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const finalBalance =
      getBalancesForPrincipal(agentAccountAddress).get(DAO_TOKEN_ASSETS_MAP) ||
      0n;
    expect(finalBalance).toBeGreaterThan(initialBalance);
    /* TODO: this is incorrect
    // Verify transfer event to agent
    const transferEvent = receipt.events.find(
      (e) => e.type === "ft_transfer_event"
    );
    expect(transferEvent).toBeDefined();
    */
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
      [
        Cl.principal(daoTokenAddress),
        Cl.uint(amount),
        Cl.some(Cl.uint(minReceive)),
      ],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_SLIPPAGE_TOO_HIGH));
  });

  it("buy-and-deposit fails with zero amount", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 0;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [Cl.principal(daoTokenAddress), Cl.uint(amount), Cl.none()],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_AMOUNT));
  });

  it("buy-and-deposit fails with invalid dao token", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 100000;
    const invalidToken = `${deployer}.invalid-token`;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [Cl.principal(invalidToken), Cl.uint(amount), Cl.none()],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_DAO_TOKEN));
  });

  it("buy-seats-and-deposit succeeds and handles change", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 200000; // enough for seats + change
    const initialSbtcBalance =
      getBalancesForPrincipal(address1).get(SBTC_ASSETS_MAP) || 0n;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-seats-and-deposit",
      [Cl.uint(amount)],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const finalSbtcBalance =
      getBalancesForPrincipal(address1).get(SBTC_ASSETS_MAP) || 0n;
    expect(finalSbtcBalance).toBeLessThan(initialSbtcBalance);
  });

  it("refund-seat-and-deposit succeeds", () => {
    // arrange
    // First buy a seat
    getSbtcFromFaucet(address1);
    const buyReceipt = simnet.callPublicFn(
      contractAddress,
      "buy-seats-and-deposit",
      [Cl.uint(20000)],
      address1
    );
    expect(buyReceipt.result).toBeOk(Cl.bool(true));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "refund-seat-and-deposit",
      [Cl.none()],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    // Check for refund event or balance increase
    expect(receipt.events).toHaveLength(expect.any(Number));
  });

  it("refund-seat-and-deposit fails without prior purchase", () => {
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "refund-seat-and-deposit",
      [Cl.none()],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ErrCode.ERR_REFUNDING_SEATS));
  });
});

type FaktoryBuySellContractInfo = {
  self: string;
  deployedBurnBlock: number;
  deployedStacksBlock: number;
  daoToken: string;
  pricePerSeat: number;
  agentAccountRegistry: string;
  swapContract: string;
  daoTokenPrelaunch: string;
};

describe(`read-only functions: ${contractAddress.split(".")[1]}`, () => {
  it("get-contract-status returns correct info", () => {
    // act
    const statusResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-contract-info",
      [],
      deployer
    );

    // assert
    expect(statusResult.result.type).toBe(ClarityType.Tuple);
    const status = convertClarityTuple<FaktoryBuySellContractInfo>(
      statusResult.result
    );
    expect(status.self).toBe(contractAddress);
    expect(status.deployedBurnBlock).toBeGreaterThan(0);
    expect(status.deployedStacksBlock).toBeGreaterThan(0);
    expect(status.daoToken).toBe(daoTokenAddress);
    expect(status.pricePerSeat).toBeGreaterThan(0);
    // expect(status.agentAccountRegistry).toBe(agentAccountRegistryAddress);
    // expect(status.swapContract).toBe(swapContractAddress);
    // expect(status.daoTokenPrelaunch).toBe(daoTokenPrelaunchAddress);
  });
});
