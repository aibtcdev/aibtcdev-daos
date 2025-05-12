import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { setupDaoContractRegistry } from "../../../utilities/contract-registry";
import { fundVoters, getDaoTokens } from "../../../utilities/dao-helpers";
import { getBalancesForPrincipal } from "../../../utilities/asset-helpers";
import { DAO_TOKEN_ASSETS_MAP } from "../../../utilities/contract-helpers";

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
  "DAO"
);
const contractName = contractAddress.split(".")[1];
const treasuryAddress = registry.getContractAddressByTypeAndSubtype(
  "EXTENSIONS",
  "TREASURY"
);
const dexAddress = registry.getContractAddressByTypeAndSubtype("TOKEN", "DEX");
const preFaktoryAddress = registry.getContractAddressByTypeAndSubtype(
  "TOKEN",
  "PRELAUNCH"
);

// Error codes
const ERR_NOT_AUTHORIZED = 401;

describe(`public functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // transfer() tests
  ////////////////////////////////////////
  it("transfer() fails if tx-sender is not the token sender", () => {
    // arrange

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "transfer",
      [
        Cl.uint(10000),
        Cl.principal(address1),
        Cl.principal(address2),
        Cl.none(),
      ],
      address2 // Different from the token sender (address1)
    );

    // assert
    expect(receipt.result).toBeErr(Cl.uint(ERR_NOT_AUTHORIZED));
  });

  it("transfer() succeeds with valid parameters", () => {
    // arrange
    const initialBalanceResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(address2)],
      deployer
    );
    expect(initialBalanceResult.result).toBeOk(Cl.uint(0));

    // Get some tokens for address1
    getDaoTokens(address1, 1000000);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "transfer",
      [
        Cl.uint(10000),
        Cl.principal(address1),
        Cl.principal(address2),
        Cl.none(),
      ],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // Check that the balance was updated
    const newBalanceResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(address2)],
      deployer
    );

    // Verify the balance increased by the transferred amount
    expect(newBalanceResult.result).toBeOk(Cl.uint(10000));
  });

  it("transfer() handles memo correctly", () => {
    // arrange
    getDaoTokens(address1, 1000000);

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "transfer",
      [
        Cl.uint(10000),
        Cl.principal(address1),
        Cl.principal(address2),
        Cl.some(Cl.bufferFromAscii("Test memo")),
      ],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // Check for print event with memo
    const printEvents = receipt.events.filter((e) => e.event === "print_event");
    expect(printEvents.length).toBeGreaterThan(0);
  });

  ////////////////////////////////////////
  // send-many() tests
  ////////////////////////////////////////
  it("send-many() succeeds with multiple recipients", () => {
    // arrange
    getDaoTokens(address1, 1000000);

    const initialBalance2Result = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(address2)],
      deployer
    );
    expect(initialBalance2Result.result).toBeOk(Cl.uint(0));

    const initialBalance3Result = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(address3)],
      deployer
    );
    expect(initialBalance3Result.result).toBeOk(Cl.uint(0));

    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "send-many",
      [
        Cl.list([
          Cl.tuple({
            to: Cl.principal(address2),
            amount: Cl.uint(5000),
            memo: Cl.none(),
          }),
          Cl.tuple({
            to: Cl.principal(address3),
            amount: Cl.uint(7500),
            memo: Cl.some(Cl.bufferFromAscii("Batch transfer")),
          }),
        ]),
      ],
      address1
    );

    // assert
    expect(receipt.result).toBeOk(Cl.bool(true));

    // Check that balances were updated
    const newBalance2Result = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(address2)],
      deployer
    );
    expect(newBalance2Result.result).toBeOk(Cl.uint(5000));

    const newBalance3Result = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(address3)],
      deployer
    );
    expect(newBalance3Result.result).toBeOk(Cl.uint(7500));
  });

  it("send-many() fails if any transfer fails", () => {
    // arrange
    // Attempt to send more tokens than the sender has
    const totalSupplyResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-supply",
      [],
      deployer
    );
    expect(totalSupplyResult.result).toBeOk(Cl.uint(100000000000000000n));
    const excessiveAmount = 100000000000000000n + 100000000000000000n; // 2x the total supply
    // act
    const receipt = simnet.callPublicFn(
      contractAddress,
      "send-many",
      [
        Cl.list([
          Cl.tuple({
            to: Cl.principal(address2),
            amount: Cl.uint(5000),
            memo: Cl.none(),
          }),
          Cl.tuple({
            to: Cl.principal(address3),
            amount: Cl.uint(excessiveAmount),
            memo: Cl.none(),
          }),
        ]),
      ],
      address1
    );

    // assert
    // Generic error from ft-transfer?
    expect(receipt.result).toBeErr(Cl.uint(1));
  });
  ////////////////////////////////////////
  // Initial token distribution tests
  ////////////////////////////////////////
  it("tokens were properly distributed on deployment", () => {
    // arrange
    const totalSupply = 100000000000000000n; // 1B with 8 decimals
    const treasuryExpected = (totalSupply * 80n) / 100n; // 80%
    const dexExpected = (totalSupply * 16n) / 100n; // 16%
    const preFaktoryExpected = (totalSupply * 4n) / 100n; // 4%

    // act
    const treasuryBalanceResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(treasuryAddress)],
      deployer
    );

    const dexBalanceResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(dexAddress)],
      deployer
    );

    const preFaktoryBalanceResult = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(preFaktoryAddress)],
      deployer
    );

    // assert
    expect(treasuryBalanceResult.result).toBeOk(Cl.uint(treasuryExpected));
    expect(dexBalanceResult.result).toBeOk(Cl.uint(dexExpected));
    expect(preFaktoryBalanceResult.result).toBeOk(Cl.uint(preFaktoryExpected));
  });
});

describe(`read-only functions: ${contractName}`, () => {
  ////////////////////////////////////////
  // get-name() tests
  ////////////////////////////////////////
  it("get-name() returns expected value", () => {
    // arrange

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-name",
      [],
      deployer
    );

    // assert
    expect(result.result).toBeOk(Cl.stringAscii("SYMBOL-AIBTC-DAO"));
  });

  ////////////////////////////////////////
  // get-symbol() tests
  ////////////////////////////////////////
  it("get-symbol() returns expected value", () => {
    // arrange

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-symbol",
      [],
      deployer
    );

    // assert
    expect(result.result).toBeOk(Cl.stringAscii("SYMBOL-AIBTC-DAO"));
  });

  ////////////////////////////////////////
  // get-decimals() tests
  ////////////////////////////////////////
  it("get-decimals() returns expected value", () => {
    // arrange

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-decimals",
      [],
      deployer
    );

    // assert
    expect(result.result).toBeOk(Cl.uint(8));
  });

  ////////////////////////////////////////
  // get-balance() tests
  ////////////////////////////////////////
  it("get-balance() returns expected value for accounts", () => {
    // arrange
    fundVoters([address1]);
    const address1Balances = getBalancesForPrincipal(address1);
    const address1DaoBalance = address1Balances.get(DAO_TOKEN_ASSETS_MAP);
    expect(address1DaoBalance).toBeDefined();

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(address1)],
      deployer
    );

    // assert
    expect(result.result).toBeOk(Cl.uint(address1DaoBalance!));
  });

  ////////////////////////////////////////
  // get-total-supply() tests
  ////////////////////////////////////////
  it("get-total-supply() returns expected value", () => {
    // arrange
    const expectedSupply = 100000000000000000n; // 1B with 8 decimals

    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-supply",
      [],
      deployer
    );

    // assert
    expect(result.result).toBeOk(Cl.uint(expectedSupply));
  });

  ////////////////////////////////////////
  // get-token-uri() tests
  ////////////////////////////////////////
  it("get-token-uri() returns expected value", () => {
    // arrange
    const expectedUri = "<%= it.token_uri %>";
    // act
    const result = simnet.callReadOnlyFn(
      contractAddress,
      "get-token-uri",
      [],
      deployer
    );

    // assert
    expect(result.result).toBeOk(Cl.some(Cl.stringUtf8(expectedUri)));
  });
});
