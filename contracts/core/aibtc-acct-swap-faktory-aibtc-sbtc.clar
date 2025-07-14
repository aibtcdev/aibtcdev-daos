;; title: aibtc-acct-swap-faktory-aibtc-sbtc
;; version: 1.0.0
;; summary: Adapter to trade on a faktory DEX with an agent account.

;; traits

;; /g/.aibtc-agent-account-traits.aibtc-account-swap-adapter/agent_account_trait_account_swap_adapter
(impl-trait .aibtc-agent-account-traits.aibtc-account-swap-adapter)
;; /g/'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_trait_sip010
(use-trait sip010-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; constants
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; error codes

;; data maps
;; data vars

;; public functions

(define-public (buy-dao-token
    (daoToken <sip010-trait>)
    (amount uint)
    (minReceive (optional uint))
  )
  (ok true)
)

(define-public (sell-dao-token
    (daoToken <sip010-trait>)
    (amount uint)
    (minReceive (optional uint))
  )
  (ok true)
)

;; read-only functions

;; private functions

;; initialization