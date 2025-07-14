;; title: aibtc-acct-swap-bitflow-aibtc-sbtc
;; version: 1.0.0
;; summary: Adapter to trade on a Bitflow XYK pool with an agent account.

;; traits

;; /g/.aibtc-agent-account-traits.aibtc-account-swap-adapter/agent_account_trait_account_swap_adapter
(impl-trait .aibtc-agent-account-traits.aibtc-account-swap-adapter)
;; /g/'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_trait_sip010
(use-trait sip010-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
;; /g/'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.xyk-pool-trait-v-1-2.xyk-pool-trait/bitflow_pool_trait
(use-trait xyk-pool-trait 'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.xyk-pool-trait-v-1-2.xyk-pool-trait)

;; constants
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; /g/'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.xyk-core-v-1-2/external_bitflow_core
(define-constant BITFLOW_CORE 'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.xyk-core-v-1-2)
;; /g/.xyk-pool-sbtc-aibtc-v-1-1/dao_contract_token_pool
(define-constant BITFLOW_POOL .xyk-pool-sbtc-aibtc-v-1-1)
;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
(define-constant SBTC_TOKEN 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token)
;; /g/.aibtc-faktory/dao_contract_token
(define-constant AIBTC_TOKEN .aibtc-faktory)

;; error codes
(define-constant ERR_INVALID_DAO_TOKEN (err u2300))
(define-constant ERR_SWAP_FAILED (err u2301))
(define-constant ERR_MIN_RECEIVE_REQUIRED (err u2302))

;; data maps
;; data vars

;; public functions

(define-public (buy-dao-token
    (daoToken <sip010-trait>)
    (amount uint)
    (minReceive (optional uint))
  )
  (begin
    (asserts! (is-eq (contract-of daoToken) AIBTC_TOKEN) ERR_INVALID_DAO_TOKEN)
    (asserts! (is-some minReceive) ERR_MIN_RECEIVE_REQUIRED)
    (match (contract-call? BITFLOW_CORE swap-x-for-y
        BITFLOW_POOL
        SBTC_TOKEN
        daoToken
        amount
        (unwrap-panic minReceive)
      )
      success (ok true)
      error (err ERR_SWAP_FAILED)
    )
  )
)

(define-public (sell-dao-token
    (daoToken <sip010-trait>)
    (amount uint)
    (minReceive (optional uint))
  )
  (begin
    (asserts! (is-eq (contract-of daoToken) AIBTC_TOKEN) ERR_INVALID_DAO_TOKEN)
    (asserts! (is-some minReceive) ERR_MIN_RECEIVE_REQUIRED)
    (match (contract-call? BITFLOW_CORE swap-y-for-x
        BITFLOW_POOL
        SBTC_TOKEN
        daoToken
        amount
        (unwrap-panic minReceive)
      )
      success (ok true)
      error (err ERR_SWAP_FAILED)
    )
  )
)

;; read-only functions

;; private functions

;; initialization
