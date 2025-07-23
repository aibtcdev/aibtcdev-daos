# Questions & Clarifications

This document tracks key questions and decisions made during the documentation process.

## Initial Scoping (Answered)

Before starting, we clarified the following points:

1.  **What is the depth of the review?**
    -   **Decision:** We will focus purely on creating condensed functional documentation. The goal is to describe what each contract and its public functions do, not to perform a deep security audit. We will start simple and can layer in more detail later.

2.  **What is the template strategy?**
    -   **Decision:** We will start with a single, generic `TEMPLATE_CONTRACT.md`. We will aim to follow existing patterns from the codebase (e.g., contract categories) as we create documentation.

3.  **How should we prioritize the work?**
    -   **Decision:** We will create a comprehensive plan covering all contracts but will start with two key contracts to establish our process: `agent-account` and `action-proposal-voting`.

With these points clarified, we have no further blocking questions and can proceed with the plan.

## Phase 2 Planning (Answered)

As we move into Phase 2, a few more questions have come up based on the initial documentation work:

1.  **External Dependencies:** The plan now includes a section for external contracts that we will skip documenting (e.g., `sbtc-token`, `xyk-core-v-1-2`). Is this the correct approach, or should we create brief stub files for them explaining their role at a high level?
    -   **Decision:** We will create stub documentation files for external dependencies. This ensures our test script passes and provides context for why these contracts are part of the repository (e.g., `sbtc-token` is a testnet version with a faucet, `xyk-core-v-1-2` is a local copy of Bitflow's core contract). We will add this to the plan.

2.  **Missing Contracts:** The `aibtc-acct-swap-bitflow-aibtc-sbtc` and `aibtc-acct-swap-faktory-aibtc-sbtc` contracts in the plan appear to be specific implementations of a swap adapter. Is there a base `aibtc-agent-account-swap-adapter` contract that should also be added to the documentation plan?
    -   **Decision:** There is no base contract. These contracts are implementations of the `.aibtc-agent-account-traits.aibtc-dao-swap-adapter` trait. We will proceed with documenting these two implementations first in Phase 2.

## Phase 3 Planning (Proposed)

With Phase 1 and 2 complete, we need to refine the plan for Phase 3 to ensure a thorough and efficient review.

1.  **How can we make the review process more systematic?** The "Review and Refine" step is currently broad. A more structured approach would help ensure consistency and completeness.
    -   **Decision:** We will expand the "Review and Refine" task in `PLANS.md`. The new plan will include creating a `REVIEW_CHECKLIST.md`, performing a structured manual review against it, and considering automated checks for things like broken links. We will also add more detail to the navigation tasks, such as suggesting a script to auto-generate the `SUMMARY.md` file.
