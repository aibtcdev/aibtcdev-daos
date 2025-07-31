# sBTC Token (Mock)

**Source:** [`sbtc-token.clar`](/.cache/requirements/STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token.clar)

## 1. Overview

This contract is a mock implementation of the sBTC token, designed for local testing and development on a testnet or simnet environment. It adheres to the SIP-010 fungible token standard and includes a public `faucet` function to allow developers to easily obtain test tokens.

This contract is treated as an external dependency and is included in the repository to facilitate a self-contained testing environment. It is not intended for production use.

---

## 2. Public Functions

- `transfer`: Transfers sBTC tokens from the sender to a recipient.
- `faucet`: Mints a fixed amount of sBTC to the caller, allowing for easy acquisition of test tokens.

---

## 3. Read-Only Functions

- `get-name`: Returns the token name ("sBTC").
- `get-symbol`: Returns the token symbol ("sBTC").
- `get-decimals`: Returns the number of decimals (8).
- `get-balance`: Returns the sBTC balance for a given principal.
- `get-total-supply`: Returns the total supply of sBTC tokens.
- `get-token-uri`: Returns the URI for the token's metadata.
