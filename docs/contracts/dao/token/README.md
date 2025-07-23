# DAO Token Contracts

**Parent:** `../README.md`

This directory contains documentation for the token-related contracts that power the aibtc.dev DAO ecosystem. These contracts are generated via an external service (`faktory.fun`) and are included here for testing and operational purposes.

## Contracts

- [`aibtc-faktory.md`](./aibtc-faktory.md): The core SIP-010 fungible token for the DAO.
- [`aibtc-pre-faktory.md`](./aibtc-pre-faktory.md): A pre-launch contract for initial token distribution and fee airdrops to early participants.
- [`aibtc-faktory-dex.md`](./aibtc-faktory-dex.md): A specialized DEX used to bootstrap liquidity for the token before it graduates to a full AMM.
- [`xyk-pool-sbtc-aibtc-v-1-1.md`](./xyk-pool-sbtc-aibtc-v-1-1.md): The Bitflow-compatible AMM liquidity pool created after the `aibtc-faktory-dex` achieves its funding goal.
