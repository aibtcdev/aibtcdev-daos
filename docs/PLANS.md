# Documentation Plan

This plan outlines the steps to create comprehensive functional documentation for all Clarity contracts. We will use markdown task lists to track progress.

## Phase 1: Setup and Initial Documentation

This phase focuses on establishing the process and documenting the first two priority contracts.

- [x] **Setup: Create Documentation Template**
  - [x] Create a generic `TEMPLATE_CONTRACT.md` file for documenting Clarity contracts.
- [x] **Setup: Create Test Script**
  - [x] Create a script in `../tests` to identify Clarity contracts in `../contracts` that are missing corresponding documentation files in `docs/contracts`.
- [ ] **Priority Contract 1: Agent Account**
  - [ ] Create `docs/contracts/agent/aibtc-agent-account.md`
  - [ ] Document the purpose, public functions, and key interactions of the contract.
- [ ] **Priority Contract 2: Action Proposal Voting**
  - [ ] Create `docs/contracts/proposals/aibtc-action-proposal-voting.md`
  - [ ] Document the purpose, public functions, and key interactions of the contract.

## Phase 2: Full Contract Documentation

This phase involves documenting the remaining contracts, categorized by their location in the `contracts` directory.

- [ ] **Core Contracts**
  - [ ] `aibtc-dao-run-cost.md`
- [ ] **DAO Contracts**
  - [ ] **Base:** `aibtc-base-dao.md`
  - [ ] **Actions:** `aibtc-action-send-message.md`
  - [ ] **Extensions:**
    - [ ] `aibtc-dao-charter.md`
    - [ ] `aibtc-dao-epoch.md`
    - [ ] `aibtc-dao-users.md`
    - [ ] `aibtc-onchain-messaging.md`
    - [ ] `aibtc-rewards-account.md`
    - [ ] `aibtc-token-owner.md`
    - [ ] `aibtc-treasury.md`
  - [ ] **Proposals:** `aibtc-base-initialize-dao.md`
  - [ ] **Token:**
    - [ ] `aibtc-faktory.md`
    - [ ] `aibtc-faktory-dex.md`
    - [ ] `aibtc-pre-faktory.md`
    - [ ] `xyk-pool-sbtc-aibtc-v-1-1.md`
  - [ ] **Trading:**
    - [ ] `aibtc-acct-swap-bitflow-aibtc-sbtc.md`
    - [ ] `aibtc-acct-swap-faktory-aibtc-sbtc.md`
    - [ ] `xyk-core-v-1-2.md` (external, can skip)
- [ ] **Trait Contracts**
  - [ ] `aibtc-agent-account-traits.md`
  - [ ] `aibtc-base-dao-trait.md`
  - [ ] `aibtc-dao-traits.md`

## Phase 3: Finalization and Review

- [ ] **Review and Refine:**
  - [ ] Review all generated documentation for consistency and clarity.
  - [ ] Update the root `README.md` and create `SUMMARY.md` to provide a table of contents and navigation guide.
  - [ ] Create `README.md` files for each subdirectory in `docs/contracts`.
- [ ] **Retrospective:**
  - [ ] Review the process and document lessons learned in `END.md`.
