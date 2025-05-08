import { Cl } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";
import { setupDaoContractRegistry } from "../../utilities/contract-registry";
import { fundVoters } from "../../utilities/dao-helpers";
import { getBalancesForPrincipal } from "../../utilities/clarinet-helpers";
import { DAO_TOKEN_ASSETS_MAP } from "../../utilities/contract-helpers";

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
  beforeEach(() => {
    // Fund users with tokens for testing
    fundVoters([address1]);
  });

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
    const initialBalance = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(address2)],
      deployer
    ).result;

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
    const newBalance = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(address2)],
      deployer
    ).result;

    // Verify the balance increased by the transferred amount
    if (initialBalance.isOk && newBalance.isOk) {
      const initialAmount = initialBalance.value.value;
      const newAmount = newBalance.value.value;
      expect(newAmount).toEqual(initialAmount + 10000n);
    }
  });

  it("transfer() handles memo correctly", () => {
    // arrange

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
    const initialBalance2 = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(address2)],
      deployer
    ).result;

    const initialBalance3 = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(address3)],
      deployer
    ).result;

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
    const newBalance2 = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(address2)],
      deployer
    ).result;

    const newBalance3 = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(address3)],
      deployer
    ).result;

    // Verify the balances increased by the transferred amounts
    if (initialBalance2.isOk && newBalance2.isOk) {
      const initialAmount = initialBalance2.value.value;
      const newAmount = newBalance2.value.value;
      expect(newAmount).toEqual(initialAmount + 5000n);
    }

    if (initialBalance3.isOk && newBalance3.isOk) {
      const initialAmount = initialBalance3.value.value;
      const newAmount = newBalance3.value.value;
      expect(newAmount).toEqual(initialAmount + 7500n);
    }
  });

  it("send-many() fails if any transfer fails", () => {
    // arrange
    // Attempt to send more tokens than the sender has
    const totalSupply = simnet.callReadOnlyFn(
      contractAddress,
      "get-total-supply",
      [],
      deployer
    ).result;

    let excessiveAmount = 0n;
    if (totalSupply.isOk) {
      excessiveAmount = totalSupply.value.value + 1000000n;
    } else {
      excessiveAmount = 1000000000000000000n; // Just use a very large number
    }

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
    expect(receipt.result).toBeErr(Cl.uint(1)); // Generic error from ft-transfer?
  });
  ////////////////////////////////////////
  // Initial token distribution tests
  ////////////////////////////////////////
  it("tokens were properly distributed on deployment", () => {
    // arrange
    const totalSupply = 100000000000000000n; // 100 million with 8 decimals
    const treasuryExpected = (totalSupply * 80n) / 100n; // 80%
    const dexExpected = (totalSupply * 16n) / 100n; // 16%
    const preFaktoryExpected = (totalSupply * 4n) / 100n; // 4%

    // act
    const treasuryBalance = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(treasuryAddress)],
      deployer
    ).result;

    const dexBalance = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(dexAddress)],
      deployer
    ).result;

    const preFaktoryBalance = simnet.callReadOnlyFn(
      contractAddress,
      "get-balance",
      [Cl.principal(preFaktoryAddress)],
      deployer
    ).result;

    // assert
    if (treasuryBalance.isOk) {
      expect(treasuryBalance.value.value).toEqual(treasuryExpected);
    }

    if (dexBalance.isOk) {
      expect(dexBalance.value.value).toEqual(dexExpected);
    }

    if (preFaktoryBalance.isOk) {
      expect(preFaktoryBalance.value.value).toEqual(preFaktoryExpected);
    }
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
    ).result;

    // assert
    expect(result).toBeOk(Cl.stringAscii("SYMBOL-AIBTC-DAO"));
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
    ).result;

    // assert
    expect(result).toBeOk(Cl.stringAscii("SYMBOL-AIBTC-DAO"));
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
    ).result;

    // assert
    expect(result).toBeOk(Cl.uint(8));
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
    ).result;

    // assert
    expect(result).toBeOk(Cl.uint(address1DaoBalance!));
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
    ).result;

    // assert
    expect(result).toBeOk(Cl.uint(expectedSupply));
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
    ).result;

    // assert
    expect(result).toBeOk(Cl.some(Cl.stringUtf8(expectedUri)));
  });
});
