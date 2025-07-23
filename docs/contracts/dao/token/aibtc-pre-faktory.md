# aibtc-pre-faktory

**Source:** [`aibtc-pre-faktory.clar`](../../../../contracts/dao/token/aibtc-pre-faktory.clar)

## 1. Overview

This contract manages the pre-launch phase of the DAO token distribution. It allows early participants to purchase "seats" using sBTC. Each seat entitles the owner to a proportional share of the pre-launch token allocation, which is released over a defined vesting schedule. The contract also collects trading fees from the `aibtc-faktory-dex` and airdrops them to seat holders, rewarding them as co-deployers of the DAO's infrastructure.

---

## 2. Traits

### Used Traits
- `faktory-token`: A trait constraint for the fungible token being distributed, ensuring it conforms to the Faktory SIP-010 standard.

---

## 3. Called Contracts

- `'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token`: Used to process sBTC payments for seat purchases, refunds, and fee airdrops.
- `.aibtc-faktory`: The DAO token contract, called when users claim their vested tokens.

---

## 4. Public Functions

- [`buy-up-to`](#buy-up-to): Purchases a specified number of seats for the caller.
- [`refund`](#refund): Allows a user to get a full refund for their purchased seats before the distribution period begins.
- [`claim`](#claim): Allows a seat holder to claim their vested tokens.
- [`claim-on-behalf`](#claim-on-behalf): Allows anyone to trigger a token claim for a specified seat holder.
- [`toggle-bonded`](#toggle-bonded): An admin function called by the DEX contract to signal that the AMM pool is live, which accelerates the vesting schedule.
- [`create-fees-receipt`](#create-fees-receipt): An admin function called by the DEX to deposit trading fees into this contract for later distribution.
- [`trigger-fee-airdrop`](#trigger-fee-airdrop): Initiates an airdrop of accumulated fees to all current seat holders.

---

### `buy-up-to`

`(buy-up-to (seat-count uint))`

**Description:**
Allows a user to purchase up to `seat-count` seats by transferring the required amount of sBTC. The contract enforces rules on the total number of seats and the maximum seats per user. If the purchase meets the criteria for a successful pre-launch (minimum users and all seats sold), it triggers the token distribution.

**Parameters:**
- `seat-count` (`uint`): The number of seats to purchase.

**Returns:**
- `(ok true)`: On success.
- `(err uint)`: If the purchase is invalid (e.g., no seats left, invalid count).

### `claim`

`(claim (ft <faktory-token>))`

**Description:**
A seat holder calls this function to receive the portion of their tokens that has vested according to the `VESTING-SCHEDULE`. The amount claimable depends on the block height and whether vesting has been accelerated.

**Parameters:**
- `ft` (`<faktory-token>`): The principal of the DAO token contract.

**Returns:**
- `(ok uint)`: The amount of tokens successfully claimed.
- `(err uint)`: If there is nothing to claim or another error occurs.

### `trigger-fee-airdrop`

`(trigger-fee-airdrop)`

**Description:**
Anyone can call this function to distribute the accumulated trading fees (held in sBTC) to all seat holders. The distribution is proportional to the number of seats each holder owns. A cooldown period prevents this from being called too frequently, unless the contract is in its final airdrop mode.

**Returns:**
- `(ok uint)`: The total amount of fees distributed.
- `(err uint)`: If the airdrop cannot be triggered (e.g., cooldown active, no fees).

---

## 5. Read-Only Functions

This contract includes numerous read-only functions to provide transparency into the pre-launch status, user entitlements, and fee distribution mechanics.

- `get-max-seats-allowed`: Returns the maximum number of additional seats a user can currently buy.
- `get-contract-status`: Returns a tuple with the overall status of the contract.
- `get-user-info`: Returns a tuple with a specific user's seat count and claimed/claimable amounts.
- `get-remaining-seats`: Returns the number of seats still available for purchase.
- `get-seats-owned`: Returns the number of seats owned by a specific address.
- `get-claimed-amount`: Returns the total amount of tokens claimed by a specific address.
- `get-vesting-schedule`: Returns the vesting schedule constant.
- `get-seat-holders`: Returns the list of all seat holders and their seat counts.
- `is-market-open`: A flag read by the DEX to determine if it can open for trading.
- `can-trigger-airdrop`: Checks if the conditions for triggering a fee airdrop are met.
- `get-fee-distribution-info`: Returns information about the current fee airdrop status.
- `get-user-expected-share`: Calculates a user's expected share of the next fee airdrop.

---

## 6. Constants

- `SEATS`: `u20`, the total number of seats available.
- `PRICE-PER-SEAT`: `u20000`, the cost of one seat in sBTC sats.
- `TOKENS-PER-SEAT`: `u200000000000000`, the number of DAO tokens allocated to each seat.
- `VESTING-SCHEDULE`: A list of tuples defining the percentage of tokens that unlock at specific block heights relative to the distribution start.
- `TOKEN-DAO`: The principal of the `.aibtc-faktory` token contract.
- `DEX-DAO`: The principal of the `.aibtc-faktory-dex` contract.

---

## 7. Variables

- `total-seats-taken`: The number of seats that have been purchased.
- `distribution-height`: The block height at which the pre-launch was successful and token distribution began.
- `accelerated-vesting`: A flag that, when true, accelerates the early stages of the vesting schedule.
- `accumulated-fees`: The amount of sBTC collected from the DEX, waiting to be airdropped.
- `last-airdrop-height`: The block height of the last fee airdrop.

---

## 8. Data Maps

- `seats-owned`: Maps a user's principal to the number of seats they own.
- `claimed-amounts`: Maps a user's principal to the total amount of tokens they have already claimed.

---

## 9. Errors

- `(err u301)`: `ERR-NO-SEATS-LEFT`.
- `(err u302)`: `ERR-NOT-SEAT-OWNER`.
- `(err u304)`: `ERR-NOTHING-TO-CLAIM`.
- `(err u305)`: `ERR-NOT-AUTHORIZED`.
- `(err u311)`: `ERR-CONTRACT-INSUFFICIENT-FUNDS`.
- `(err u313)`: `ERR-INVALID-SEAT-COUNT`.
- `(err u320)`: `ERR-DISTRIBUTION-ALREADY-SET`.
- `(err u321)`: `ERR-DISTRIBUTION-NOT-INITIALIZED`.
- `(err u323)`: `ERR-NO-FEES-TO-DISTRIBUTE`.
- `(err u324)`: `ERR-COOLDOWN-ACTIVE`.
