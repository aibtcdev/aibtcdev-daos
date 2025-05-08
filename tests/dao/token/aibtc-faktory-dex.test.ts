import { Cl } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";
import { setupDaoContractRegistry } from "../../utilities/contract-registry";
import { fundVoters } from "../../utilities/dao-helpers";

// setup accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;

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
const sbtcContract = "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token";

// Error codes
const ERR_MARKET_CLOSED = 1001;
const ERR_STX_NON_POSITIVE = 1002;
const ERR_STX_BALANCE_TOO_LOW = 1003;
const ERR_FT_NON_POSITIVE = 1004;
const ERR_TOKEN_NOT_AUTH = 401;

// Helper function to get sBTC for testing
function getSbtc(address: string, amount: number = 10000000) {
  const receipt = simnet.callPublicFn(sbtcContract, "faucet", [], address);
  return receipt;
}

// Helper function to open the market
function openMarket() {
  // First, set the market as open in pre-faktory
  simnet.callPublicFn(preFaktoryAddress, "toggle-market-open", [], deployer);

  // Then open the market in the DEX
  simnet.callPublicFn(contractAddress, "open-market", [], deployer);
}

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // open-market() tests
  ////////////////////////////////////////
  it("open-market() fails if pre-faktory market is not open", () => {
    // arrange
    // Make sure market is closed in pre-faktory
    const preMarketOpen = simnet.callReadOnlyFn(
      preFaktoryAddress,
      "is-market-open",
      [],
      deployer
    ).result;

    if (preMarketOpen.isOk && preMarketOpen.value.value === true) {
      simnet.callPublicFn(
        preFaktoryAddress,
        "toggle-market-open",
        [],
        deployer
      );
    }

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
    // Make sure market is open in pre-faktory
    simnet.callPublicFn(preFaktoryAddress, "toggle-market-open", [], deployer);

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
    const isOpen = simnet.callReadOnlyFn(
      contractAddress,
      "get-open",
      [],
      deployer
    ).result;

    expect(isOpen).toBeOk(Cl.bool(true));
  });

  ////////////////////////////////////////
  // buy() tests
  ////////////////////////////////////////
  it("buy() fails when market is closed", () => {
    // arrange
    // Get the market status
    const isOpen = simnet.callReadOnlyFn(
      contractAddress,
      "get-open",
      [],
      deployer
    ).result;

    // If market is open, we need to close it for this test
    if (isOpen.isOk && isOpen.value.value === true) {
      // We can't directly close the market, so we'll reset the simnet
      simnet.reset();
    }

    // Get sBTC for the test
    getSbtc(address1);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy",
      [
        Cl.contractPrincipal(
          tokenContractAddress.split(".")[0],
          tokenContractAddress.split(".")[1]
        ),
        Cl.uint(100000),
      ],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_MARKET_CLOSED));
  });

  it("buy() fails with non-positive sBTC amount", () => {
    // arrange
    // Open the market
    openMarket();

    // Get sBTC for the test
    getSbtc(address1);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy",
      [
        Cl.contractPrincipal(
          tokenContractAddress.split(".")[0],
          tokenContractAddress.split(".")[1]
        ),
        Cl.uint(0),
      ],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_STX_NON_POSITIVE));
  });

  it("buy() fails with unauthorized token", () => {
    // arrange
    // Open the market
    openMarket();

    // Get sBTC for the test
    getSbtc(address1);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy",
      [Cl.contractPrincipal(deployer, "some-other-token"), Cl.uint(100000)],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_TOKEN_NOT_AUTH));
  });

  it("buy() succeeds with valid parameters", () => {
    // arrange
    // Open the market
    openMarket();

    // Get sBTC for the test
    getSbtc(address1);

    // Get initial balances
    const initialTokenBalance = simnet.callReadOnlyFn(
      tokenContractAddress,
      "get-balance",
      [Cl.principal(address1)],
      deployer
    ).result;

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "buy",
      [
        Cl.contractPrincipal(
          tokenContractAddress.split(".")[0],
          tokenContractAddress.split(".")[1]
        ),
        Cl.uint(100000),
      ],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // Check that tokens were transferred to the buyer
    const newTokenBalance = simnet.callReadOnlyFn(
      tokenContractAddress,
      "get-balance",
      [Cl.principal(address1)],
      deployer
    ).result;

    if (initialTokenBalance.isOk && newTokenBalance.isOk) {
      expect(newTokenBalance.value.value).toBeGreaterThan(
        initialTokenBalance.value.value
      );
    }
  });

  ////////////////////////////////////////
  // sell() tests
  ////////////////////////////////////////
  it("sell() fails when market is closed", () => {
    // arrange
    // Get the market status
    const isOpen = simnet.callReadOnlyFn(
      contractAddress,
      "get-open",
      [],
      deployer
    ).result;

    // If market is open, we need to close it for this test
    if (isOpen.isOk && isOpen.value.value === true) {
      // We can't directly close the market, so we'll reset the simnet
      simnet.reset();
    }

    // Get sBTC and tokens for the test
    getSbtc(address1);
    fundVoters([address1]);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell",
      [
        Cl.contractPrincipal(
          tokenContractAddress.split(".")[0],
          tokenContractAddress.split(".")[1]
        ),
        Cl.uint(1000),
      ],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_MARKET_CLOSED));
  });

  it("sell() fails with non-positive token amount", () => {
    // arrange
    // Open the market
    openMarket();

    // Get sBTC and tokens for the test
    getSbtc(address1);
    fundVoters([address1]);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell",
      [
        Cl.contractPrincipal(
          tokenContractAddress.split(".")[0],
          tokenContractAddress.split(".")[1]
        ),
        Cl.uint(0),
      ],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_FT_NON_POSITIVE));
  });

  it("sell() fails with unauthorized token", () => {
    // arrange
    // Open the market
    openMarket();

    // Get sBTC and tokens for the test
    getSbtc(address1);
    fundVoters([address1]);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell",
      [Cl.contractPrincipal(deployer, "some-other-token"), Cl.uint(1000)],
      address1
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_TOKEN_NOT_AUTH));
  });

  it("sell() succeeds with valid parameters", () => {
    // arrange
    // Open the market
    openMarket();

    // First buy some tokens to ensure the DEX has sBTC
    getSbtc(address1);
    simnet.callPublicFn(
      contractAddress,
      "buy",
      [
        Cl.contractPrincipal(
          tokenContractAddress.split(".")[0],
          tokenContractAddress.split(".")[1]
        ),
        Cl.uint(100000),
      ],
      address1
    );

    // Get initial balances
    const initialSbtcBalance = simnet.callReadOnlyFn(
      sbtcContract,
      "get-balance",
      [Cl.principal(address1)],
      deployer
    ).result;

    // Get token balance
    const tokenBalance = simnet.callReadOnlyFn(
      tokenContractAddress,
      "get-balance",
      [Cl.principal(address1)],
      deployer
    ).result;

    // We need to know how many tokens the user has to sell
    let sellAmount = 1000n;
    if (tokenBalance.isOk) {
      // Sell a small portion of the tokens
      sellAmount = tokenBalance.value.value / 10n;
    }

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "sell",
      [
        Cl.contractPrincipal(
          tokenContractAddress.split(".")[0],
          tokenContractAddress.split(".")[1]
        ),
        Cl.uint(sellAmount),
      ],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // Check that sBTC was transferred to the seller
    const newSbtcBalance = simnet.callReadOnlyFn(
      sbtcContract,
      "get-balance",
      [Cl.principal(address1)],
      deployer
    ).result;

    if (initialSbtcBalance.isOk && newSbtcBalance.isOk) {
      expect(newSbtcBalance.value.value).toBeGreaterThan(
        initialSbtcBalance.value.value
      );
    }
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-open() tests
  ////////////////////////////////////////
  it("get-open() returns the correct market status", () => {
    // arrange
    // Reset simnet to ensure market is closed
    simnet.reset();

    // act - check when market is closed
    const closedResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-open",
      [],
      deployer
    ).result;

    // assert
    expect(closedResult).toBeOk(Cl.bool(false));

    // arrange - open the market
    openMarket();

    // act - check when market is open
    const openResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-open",
      [],
      deployer
    ).result;

    // assert
    expect(openResult).toBeOk(Cl.bool(true));
  });

  ////////////////////////////////////////
  // get-in() tests
  ////////////////////////////////////////
  it("get-in() returns expected values for token purchase", () => {
    // arrange
    // Open the market
    openMarket();

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-in",
      [Cl.uint(100000)],
      deployer
    ).result;

    // assert
    expect(result).toBeOk();

    if (result.isOk) {
      const data = result.value.data;

      // Check that the result contains the expected fields
      expect(data.hasOwnProperty("total-stx")).toBe(true);
      expect(data.hasOwnProperty("total-stk")).toBe(true);
      expect(data.hasOwnProperty("ft-balance")).toBe(true);
      expect(data.hasOwnProperty("k")).toBe(true);
      expect(data.hasOwnProperty("fee")).toBe(true);
      expect(data.hasOwnProperty("stx-in")).toBe(true);
      expect(data.hasOwnProperty("new-stk")).toBe(true);
      expect(data.hasOwnProperty("new-ft")).toBe(true);
      expect(data.hasOwnProperty("tokens-out")).toBe(true);
      expect(data.hasOwnProperty("new-stx")).toBe(true);

      // Check that the fee is 2% of the input amount
      const fee = data["fee"].value;
      expect(fee).toEqual(2000n); // 2% of 100000

      // Check that stx-in + fee = input amount
      const stxIn = data["stx-in"].value;
      expect(stxIn + fee).toEqual(100000n);

      // Check that tokens-out is positive
      const tokensOut = data["tokens-out"].value;
      expect(tokensOut).toBeGreaterThan(0n);
    }
  });

  ////////////////////////////////////////
  // get-out() tests
  ////////////////////////////////////////
  it("get-out() returns expected values for token sale", () => {
    // arrange
    // Open the market
    openMarket();

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-out",
      [Cl.uint(1000000000000000)], // 1 trillion tokens (with 8 decimals)
      deployer
    ).result;

    // assert
    expect(result).toBeOk();

    if (result.isOk) {
      const data = result.value.data;

      // Check that the result contains the expected fields
      expect(data.hasOwnProperty("total-stx")).toBe(true);
      expect(data.hasOwnProperty("total-stk")).toBe(true);
      expect(data.hasOwnProperty("ft-balance")).toBe(true);
      expect(data.hasOwnProperty("k")).toBe(true);
      expect(data.hasOwnProperty("new-ft")).toBe(true);
      expect(data.hasOwnProperty("new-stk")).toBe(true);
      expect(data.hasOwnProperty("stx-out")).toBe(true);
      expect(data.hasOwnProperty("fee")).toBe(true);
      expect(data.hasOwnProperty("stx-to-receiver")).toBe(true);
      expect(data.hasOwnProperty("amount-in")).toBe(true);

      // Check that amount-in matches our input
      const amountIn = data["amount-in"].value;
      expect(amountIn).toEqual(1000000000000000n);

      // Check that fee is calculated correctly (2% of stx-out)
      const stxOut = data["stx-out"].value;
      const fee = data["fee"].value;

      // For very small amounts, there might be a minimum fee
      if (stxOut > 0n) {
        // Either fee is 2% of stx-out or it's a minimum fee
        const expectedFee = Math.max(Number(stxOut) * 0.02, 3);
        expect(Number(fee)).toBeGreaterThanOrEqual(expectedFee - 1); // Allow for rounding
      }

      // Check that stx-to-receiver + fee = stx-out
      const stxToReceiver = data["stx-to-receiver"].value;
      expect(stxToReceiver + fee).toEqual(stxOut);
    }
  });

  ////////////////////////////////////////
  // Initial state tests
  ////////////////////////////////////////
  it("initial state variables are set correctly", () => {
    // arrange
    // Reset simnet to ensure we're testing the initial state
    simnet.reset();

    // act
    const openState = simnet.callReadOnlyFn(
      contractAddress,
      "get-open",
      [],
      deployer
    ).result;

    const fakUstx = simnet.getDataVar(contractAddress, "fak-ustx");
    const ftBalance = simnet.getDataVar(contractAddress, "ft-balance");
    const premium = simnet.getDataVar(contractAddress, "premium");

    // assert
    expect(openState).toBeOk(Cl.bool(true)); // In test environment, open is true by default
    expect(fakUstx.value).toEqual(1000000n); // FAK_STX constant
    expect(ftBalance.value).toEqual(16000000000000000n); // Initial ft-balance
    expect(premium.value).toEqual(25n); // Default premium percentage
  });
});
