# 2025-06 Coinfabrik AIBTC DAO Audit

The full audit report is [stored as a PDF here](./2025-06%20CoinFabrik%20AIBTC%20DAO%20Audit%20FINAL%20PUBLISHED.pdf), and can also be found:

- [in the Coinfabrik GitHub repository](https://github.com/CoinFabrik/coinfabrik-audit-reports/tree/main/AIBTC)
- [on the Coinfabrik blog](https://www.coinfabrik.com/blog/aibtc-dao-audit-report/)

In response to the initial audit the development team organized the findings into a contract by contract view with information about each applied fix.

## Contract by Contract

### `aibtc-dao-run-cost.clar`

| ID    | Severity | Auditor finding                | Our action                    |
| ----- | -------- | ------------------------------ | ----------------------------- |
| CR‑01 | Critical | Proposal replay vulnerability  | **Fixed** (v0.26.0 `90d2616`) |
| ME‑01 | Medium   | Param mismatch on confirmation | **Fixed** (v0.26.0 `90d2616`) |
| LO‑01 | Low      | Timestamp overwrite            | **Fixed** (v0.26.0 `90d2616`) |

### `aibtc-agent-account.clar`

| ID    | Severity | Auditor finding               | Our action                    |
| ----- | -------- | ----------------------------- | ----------------------------- |
| HI‑01 | High     | Unvalidated external contract | **Fixed** (v0.19.0 `18161b2`) |

### `aibtc-faktory-dex.clar`

| ID    | Severity | Auditor finding               | Our action                    |
| ----- | -------- | ----------------------------- | ----------------------------- |
| HI‑02 | High     | DEX starts open at deploy     | **Fixed** (v0.33.0 `5be2737`) |
| HI‑03 | High     | DEX can reopen after finalise | **Fixed** (v0.33.0 `5be2737`) |

### `aibtc-pre-faktory.clar`

| ID    | Severity | Auditor finding | Our action                    |
| ----- | -------- | --------------- | ----------------------------- |
| HI‑04 | High     | Underflow → DoS | **Fixed** (v0.33.0 `5be2737`) |

### `aibtc-action-proposal-voting.clar`

| ID    | Severity | Auditor finding          | Our action                    | Our response                                           |
| ----- | -------- | ------------------------ | ----------------------------- | ------------------------------------------------------ |
| ME‑02 | Medium   | Fee balance check        | **Fixed** (v0.30.0 `bfe3f02`) |                                                        |
| ME‑03 | Medium   | Single‑attempt execution | **Acknowledged**              | Intentional, by design for simplicity in first cohort. |

### `aibtc-dao-charter.clar`

| ID    | Severity | Auditor finding   | Our action                    |
| ----- | -------- | ----------------- | ----------------------------- |
| LO‑02 | Low      | Redundant storage | **Fixed** (v0.24.0 `10ad852`) |

### `aibtc-dao-users.clar`

| ID    | Severity | Auditor finding       | Our action                    |
| ----- | -------- | --------------------- | ----------------------------- |
| LO‑03 | Low      | Incorrect `createdAt` | **Fixed** (v0.22.0 `2020e10`) |

### `aibtc-onchain-messaging.clar`

| ID    | Severity | Auditor finding | Our action                   |     |
| ----- | -------- | --------------- | ---------------------------- | --- |
| LO‑04 | Low      | Spam vector     | **Fixed** (v0.32.0 `12de3b`) |     |

### `xyk-pool-sbtc-aibtc-v-1-1.clar`

| ID    | Severity | Auditor finding        | Our action       | Our response                                                                                                                              |
| ----- | -------- | ---------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| ME‑04 | Medium   | Pool can re‑initialise | **Acknowledged** | Caller must be `CORE_ADDRESS` and Bitflow core contract asserts pool can only be created once. Suggest downgrade if still worth flagging. |
