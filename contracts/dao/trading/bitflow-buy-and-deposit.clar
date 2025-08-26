;; title: bitflow-buy-and-deposit
;; version: 1.0.0
;; summary: Adapter to perform a swap trade for the user then send to an AI agent account if registered. Fallback is default behavior.

;; traits

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
(define-constant ERR_INVALID_DAO_TOKEN (err u2500))
(define-constant ERR_SWAP_FAILED (err u2501))
(define-constant ERR_QUOTE_FAILED (err u2502))
(define-constant ERR_SLIPPAGE_TOO_HIGH (err u2503))
(define-constant ERR_MIN_RECEIVE_REQUIRED (err u2504))

;; public functions

(define-public (buy-and-deposit (daoToken <sip010-trait>) (amount uint) (minReceive (optional uint)))
  (let ((daoTokenContract (contract-of daoToken)))
    (asserts! (is-eq daoTokenContract DAO_TOKEN) ERR_INVALID_DAO_TOKEN)
    (asserts! (is-some minReceive) ERR_MIN_RECEIVE_REQUIRED)
    ;; /g/.xyk-core-v-1-2/external_bitflow_core
    (contract-call? .xyk-core-v-1-2
      ;; /g/.xyk-pool-sbtc-aibtc-v-1-1/dao_contract_bitflow_pool
      swap-x-for-y .xyk-pool-sbtc-aibtc-v-1-1 SBTC_TOKEN daoToken amount
      (unwrap-panic minReceive)
    )
  )
)
