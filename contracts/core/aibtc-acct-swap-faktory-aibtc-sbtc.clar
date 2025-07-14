;; title: aibtc-acct-swap-faktory-sbtc
;; version: 1.0.0
;; summary: Adapter to trade on a faktory DEX with an agent account.

;; traits

;; /g/.aibtc-agent-account-traits.aibtc-account-swap-adapter/agent_account_trait_account_swap_adapter
(impl-trait .aibtc-agent-account-traits.aibtc-account-swap-adapter)
;; /g/'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_trait_sip010
(use-trait sip010-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
;; /g/.aibtc-dao-traits.faktory-dex/dao_trait_faktory_dex
(use-trait dao-faktory-dex .aibtc-dao-traits.faktory-dex)

;; constants
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; /g/.aibtc-faktory-dex/dao_contract_token_dex
(define-constant FAKTORY_DEX .aibtc-faktory-dex)
;; /g/.aibtc-faktory/dao_contract_token
(define-constant AIBTC_TOKEN .aibtc-faktory)

;; error codes
(define-constant ERR_INVALID_DAO_TOKEN (err u2200))
(define-constant ERR_SWAP_FAILED (err u2201))

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
    (match (contract-call? FAKTORY_DEX buy daoToken amount)
      success success
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
    (match (contract-call? FAKTORY_DEX sell daoToken amount)
      success success
      error (err ERR_SWAP_FAILED)
    )
  )
)

;; read-only functions

;; private functions

;; initialization
