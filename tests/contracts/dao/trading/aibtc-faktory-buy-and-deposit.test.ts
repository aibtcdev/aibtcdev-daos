import { Cl, ClarityType } from "@stacks/transactions";
import { beforeEach, describe, expect, it } from "vitest";
import { ErrCodeFaktoryBuyAndDeposit } from "../../../../utilities/contract-error-codes";
import { setupFullContractRegistry } from "../../../../utilities/contract-registry";
import {
  convertClarityTuple,
  DAO_TOKEN_ASSETS_MAP,
  SBTC_ASSETS_MAP,
} from "../../../../utilities/contract-helpers";
import {
  getSbtcFromFaucet,
  completePrelaunch,
} from "../../../../utilities/dao-helpers";
import { getBalancesForPrincipal } from "../../../../utilities/asset-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!; // owner
const address1 = accounts.get("wallet_1")!; // agent
const address2 = accounts.get("wallet_2")!; // no agent account

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
    const initialBalance =
      getBalancesForPrincipal(address2).get(DAO_TOKEN_ASSETS_MAP) || 0n;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy-and-deposit",
      [Cl.principal(daoTokenAddress), Cl.uint(amount), Cl.none()],
      address2
    );

    // assert
    if (receipt.result.type !== ClarityType.ResponseOk) {
      throw new Error(
        `buy-and-deposit failed: ${JSON.stringify(receipt.result)}`
      );
    }

    // extract value
    const { value } = receipt.result;

    if (value.type !== ClarityType.UInt) {
      throw new Error(
        `buy-and-deposit response malformed, unexpected value: ${JSON.stringify(
          value
        )}`
      );
    }

    const finalBalance =
      getBalancesForPrincipal(address2).get(DAO_TOKEN_ASSETS_MAP) || 0n;
    expect(finalBalance).toBeGreaterThan(initialBalance);
    expect(finalBalance).toEqual(value.value);
  });

  it("buy-and-deposit succeeds with agent account", () => {
    // arrange
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
      deployer
    );
    const finalBalance =
      getBalancesForPrincipal(agentAccountAddress).get(DAO_TOKEN_ASSETS_MAP) ||
      0n;

    // assert
    if (receipt.result.type !== ClarityType.ResponseOk) {
      throw new Error(
        `buy-and-deposit failed: ${JSON.stringify(receipt.result)}`
      );
    }
    const { value } = receipt.result;
    if (value.type !== ClarityType.UInt) {
      throw new Error(
        `buy-and-deposit response malformed, unexpected value: ${JSON.stringify(
          value
        )}`
      );
    }

    expect(receipt.result).toBeOk(Cl.uint(finalBalance));
    expect(finalBalance).toBeGreaterThan(initialBalance);
    expect(finalBalance).toEqual(value.value);
  });

  it("buy-and-deposit fails with slippage too high", () => {
    // arrange
    getSbtcFromFaucet(address1);
    const amount = 100000;
    const minReceive = 100000000000000000n; // unrealistically high

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
    const invalidToken = `${deployer}.unknown-token`;

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
    const amountToSpend = 20000;
    const numberOfSeats = 1;
    // First buy a seat
    getSbtcFromFaucet(address1);
    const buyReceipt = simnet.callPublicFn(
      contractAddress,
      "buy-seats-and-deposit",
      [Cl.uint(amountToSpend)],
      address1
    );
    expect(buyReceipt.result).toBeOk(Cl.uint(numberOfSeats));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "refund-seat-and-deposit",
      [],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.uint(numberOfSeats));
  });

  it("refund-seat-and-deposit fails without prior purchase", () => {
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "refund-seat-and-deposit",
      [],
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
