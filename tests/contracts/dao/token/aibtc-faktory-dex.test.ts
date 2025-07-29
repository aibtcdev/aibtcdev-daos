import { Cl, ClarityType, cvToValue, UIntCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { setupDaoContractRegistry } from "../../../../utilities/contract-registry";
import {
  completePrelaunch,
  getSbtcFromFaucet,
} from "../../../../utilities/dao-helpers";
import {
  SBTC_ASSETS_MAP,
  SBTC_CONTRACT,
} from "../../../../utilities/contract-helpers";
import { dbgLog } from "../../../../utilities/debug-logging";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

// setup contract info for tests
const registry = setupDaoContractRegistry();
const contractAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DEX"
);
const contractName = contractAddress.split(".")[1];
const tokenContractAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "DAO"
);
const preFaktoryAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "PRELAUNCH"
);

// Error codes
const ERR_MARKET_CLOSED = 1001;
const ERR_STX_NON_POSITIVE = 1002;
const ERR_STX_BALANCE_TOO_LOW = 1003;
const ERR_FT_NON_POSITIVE = 1004;
const ERR_TOKEN_NOT_AUTH = 401;

describe.skip(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // open-market() tests
  ////////////////////////////////////////
  it("open-market() fails if pre-faktory market is not open", () => {
    // arrange
    // Ensure pre-faktory market is not open (default state on new simnet)
    const preMarketOpenResult = simnet.callReadOnlyFn(
      preFaktoryAddress,
      "is-market-open",
      [],
      deployer
    );
    expect(preMarketOpenResult.result).toBeOk(Cl.bool(false));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "open-market",
      [],
      deployer
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_MARKET_CLOSED));
  });

  it("open-market() succeeds when pre-faktory market is open", () => {
    // arrange
    // Complete prelaunch, which opens the pre-faktory market
    completePrelaunch(deployer);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "open-market",
      [],
      deployer
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // Verify market is now open
    const isOpenResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-open",
      [],
      deployer
    );
    expect(isOpenResult.result).toBeOk(Cl.bool(true));
  });

  ////////////////////////////////////////
  // buy() tests
  ////////////////////////////////////////
  it("buy() fails with non-positive sBTC amount", () => {
    // arrange
    completePrelaunch(deployer);
    getSbtcFromFaucet(address1);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy",
      [Cl.principal(tokenContractAddress), Cl.uint(0)],
      address1
    );

    // assert
    // The contract asserts ubtc >= u4, so 0 will fail.
    expect(receipt.result).toBeErr(Cl.uint(ERR_STX_NON_POSITIVE));
  });

  it("buy() fails with unauthorized token", () => {
    // arrange
    completePrelaunch(deployer);
    getSbtcFromFaucet(address1);

    // Use a token that exists but is not the authorized token
    // We'll use the sbtc token contract as a stand-in
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(100000)],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_TOKEN_NOT_AUTH));
  });

  it("buy() succeeds with valid parameters, opening the market automatically", () => {
    // arrange
    completePrelaunch(deployer);
    getSbtcFromFaucet(address1);

    // Get initial balances
    const initialTokenBalanceResult = simnet.callReadOnlyFn(
      tokenContractAddress,
      "get-balance",
      [Cl.principal(address1)],
      deployer
    ).result;

    if (initialTokenBalanceResult.type !== ClarityType.ResponseOk) {
      throw new Error("get-balance() failed when it shouldn't");
    }

    if (initialTokenBalanceResult.value.type !== ClarityType.UInt) {
      throw new Error("get-balance() did not return a UInt");
    }

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy",
      [Cl.principal(tokenContractAddress), Cl.uint(100000)],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // Check that tokens were transferred to the buyer
    const newTokenBalanceResult = simnet.callReadOnlyFn(
      tokenContractAddress,
      "get-balance",
      [Cl.principal(address1)],
      deployer
    ).result;

    if (newTokenBalanceResult.type !== ClarityType.ResponseOk) {
      throw new Error("get-balance() failed when it shouldn't");
    }

    if (newTokenBalanceResult.value.type !== ClarityType.UInt) {
      throw new Error("get-balance() did not return a UInt");
    }

    // Verify the balance increased
    const newTokenBalance = cvToValue(newTokenBalanceResult.value) as bigint;
    const initialTokenBalance = cvToValue(
      initialTokenBalanceResult.value
    ) as bigint;
    expect(newTokenBalance).toBeGreaterThan(initialTokenBalance);
  });

  ////////////////////////////////////////
  // sell() tests
  ////////////////////////////////////////
  it("sell() fails with non-positive token amount", () => {
    // arrange
    completePrelaunch(deployer);
    getSbtcFromFaucet(address1);
    // Buy some tokens to have a balance to sell
    simnet.callPublicFn(
      contractAddress,
      "buy",
      [Cl.principal(tokenContractAddress), Cl.uint(100000)],
      address1
    );

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell",
      [Cl.principal(tokenContractAddress), Cl.uint(0)],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_FT_NON_POSITIVE));
  });

  it("sell() fails with unauthorized token", () => {
    // arrange
    completePrelaunch(deployer);
    getSbtcFromFaucet(address1);
    // Buy some tokens to have a balance to sell
    simnet.callPublicFn(
      contractAddress,
      "buy",
      [Cl.principal(tokenContractAddress), Cl.uint(100000)],
      address1
    );

    // Use a token that exists but is not the authorized token
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell",
      [Cl.principal(SBTC_CONTRACT), Cl.uint(1000)],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_TOKEN_NOT_AUTH));
  });

  it("sell() succeeds with valid parameters", () => {
    // arrange
    completePrelaunch(deployer);
    getSbtcFromFaucet(address2);

    // Buy some tokens to have a balance to sell
    simnet.callPublicFn(
      contractAddress,
      "buy",
      [Cl.principal(tokenContractAddress), Cl.uint(100000)],
      address2
    );

    const sbtcBalanceBefore = simnet
      .getAssetsMap()
      .get(SBTC_ASSETS_MAP)
      ?.get(address2)!;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell",
      [Cl.principal(tokenContractAddress), Cl.uint(100000000000000)], // Sell a portion of bought tokens
      address2
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));
    const sbtcBalanceAfter = simnet
      .getAssetsMap()
      .get(SBTC_ASSETS_MAP)
      ?.get(address2)!;
    expect(sbtcBalanceAfter).toBeGreaterThan(sbtcBalanceBefore);
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-open() tests
  ////////////////////////////////////////
  it("get-open() returns a valid response", () => {
    // act - check current market status
    const currentStatus = simnet.callReadOnlyFn(
      contractAddress,
      "get-open",
      [],
      deployer
    );

    // Just verify that we get a valid boolean response
    expect(currentStatus.result.type).toBe(ClarityType.ResponseOk);
    const isOpen = cvToValue(currentStatus.result.value);
    expect(typeof isOpen).toBe("boolean");
  });

  ////////////////////////////////////////
  // get-in() tests
  ////////////////////////////////////////
  it("get-in() returns expected values for token purchase", () => {
    // arrange
    // The DEX is initialized with DEX-AMOUNT (u250000) stx-balance.
    const expectedStructure = {
      "total-stx": Cl.uint(250000),
      "total-stk": Cl.uint(1250000),
      "ft-balance": Cl.uint(16000000000000000n),
      k: Cl.uint(20000000000000000000000n),
      fee: Cl.uint(2000),
      "stx-in": Cl.uint(98000),
      "new-stk": Cl.uint(1348000),
      "new-ft": Cl.uint(14836795252225519n),
      "tokens-out": Cl.uint(1163204747774481n),
      "new-stx": Cl.uint(348000),
      "stx-to-grad": Cl.uint(4892500),
    };

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-in",
      [Cl.uint(100000)],
      deployer
    ).result;

    // verify we got an ok result
    if (result.type !== ClarityType.ResponseOk) {
      throw new Error("get-in() failed when it shouldn't");
    }

    // verify we got a tuple in ok result
    if (result.value.type !== ClarityType.Tuple) {
      throw new Error("get-in() did not return a tuple");
    }

    // assert
    expect(result.value.value).toStrictEqual(expectedStructure);
  });

  ////////////////////////////////////////
  // get-out() tests
  ////////////////////////////////////////
  it("get-out() returns a valid response for a token sale", () => {
    // arrange
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-out",
      [Cl.uint(100000000000000)], // a reasonable amount of tokens
      deployer
    );

    // assert - just check that we get a valid response
    expect(result.result.type).toBe(ClarityType.ResponseOk);
    expect(cvToValue(result.result).value).toHaveProperty("stx-out");
  });

  ////////////////////////////////////////
  // Initial state tests
  ////////////////////////////////////////
  it("initial state variables are set correctly", () => {
    // act
    const fakUstx = simnet.getDataVar(contractAddress, "fak-ustx") as UIntCV;
    const ftBalance = simnet.getDataVar(
      contractAddress,
      "ft-balance"
    ) as UIntCV;
    const premium = simnet.getDataVar(contractAddress, "premium") as UIntCV;

    // assert - check that values match expected constants
    expect(fakUstx.value).toEqual(1000000n); // FAK_STX constant
    expect(ftBalance.value).toEqual(16000000000000000n); // Initial ft-balance
    expect(premium.value).toEqual(25n); // Default premium percentage
  });
});
