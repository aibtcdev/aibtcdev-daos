;; /g/aibtc/dao_token_symbol
;; title: aibtc-acct-swap-bitflow-aibtc-sbtc
;; version: 1.0.0
;; /g/aibtc/dao_token_symbol
;; summary: Adapter to trade aibtc:sbtc on the Bitflow pool with an agent account.

;; traits

;; /g/.aibtc-agent-account-traits.aibtc-dao-swap-adapter/agent_account_trait_dao_swap_adapter
(impl-trait .aibtc-agent-account-traits.aibtc-dao-swap-adapter)
;; /g/'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_trait_sip010
(use-trait sip010-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; constants
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
(define-constant SBTC_TOKEN 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token)
;; /g/.aibtc-faktory/dao_contract_token
(define-constant DAO_TOKEN .aibtc-faktory)

;; error codes
(define-constant ERR_INVALID_DAO_TOKEN (err u2300))
(define-constant ERR_INVALID_AMOUNT (err u2301))
(define-constant ERR_MIN_RECEIVE_REQUIRED (err u2302))

;; public functions

(define-public (buy-dao-token
    (daoToken <sip010-trait>)
    (amount uint)
    (minReceive (optional uint))
  )
  (let ((daoTokenContract (contract-of daoToken)))
    ;; verify token matches adapter config
    (asserts! (is-eq daoTokenContract DAO_TOKEN) ERR_INVALID_DAO_TOKEN)
    ;; verify amount is positive
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    ;; verify minReceive is provided as param
    (asserts! (is-some minReceive) ERR_MIN_RECEIVE_REQUIRED)
    ;; /g/.xyk-core-v-1-2/external_bitflow_core
    ;; /g/.xyk-pool-sbtc-aibtc-v-1-1/dao_contract_bitflow_pool
    (try! (contract-call? .xyk-core-v-1-2 swap-x-for-y .xyk-pool-sbtc-aibtc-v-1-1
      SBTC_TOKEN daoToken amount (unwrap-panic minReceive)
    ))
    (ok true)
  )
)

(define-public (sell-dao-token
    (daoToken <sip010-trait>)
    (amount uint)
    (minReceive (optional uint))
  )
  (let ((daoTokenContract (contract-of daoToken)))
    (asserts! (is-eq daoTokenContract DAO_TOKEN) ERR_INVALID_DAO_TOKEN)
    (asserts! (is-some minReceive) ERR_MIN_RECEIVE_REQUIRED)
    ;; /g/.xyk-core-v-1-2/external_bitflow_core
    ;; /g/.xyk-pool-sbtc-aibtc-v-1-1/dao_contract_bitflow_pool
    (try! (contract-call? .xyk-core-v-1-2 swap-y-for-x .xyk-pool-sbtc-aibtc-v-1-1
      SBTC_TOKEN daoToken amount (unwrap-panic minReceive)
    ))
    (ok true)
  )
)

;; read-only functions

(define-read-only (get-contract-info)
  {
    self: SELF,
    deployedBurnBlock: DEPLOYED_BURN_BLOCK,
    deployedStacksBlock: DEPLOYED_STACKS_BLOCK,
    ;; /g/.xyk-core-v-1-2/external_bitflow_core
    bitflowCore: .xyk-core-v-1-2,
    ;; /g/.xyk-pool-sbtc-aibtc-v-1-1/dao_contract_bitflow_pool
    swapContract: .xyk-pool-sbtc-aibtc-v-1-1,
    daoToken: DAO_TOKEN,
  }
)
