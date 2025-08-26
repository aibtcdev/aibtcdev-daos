;; title: faktory-buy-and-deposit
;; version: 1.0.0
;; summary: Adapter to perform a swap trade for the user then send to an AI agent account if registered. Fallback is default behavior.

;; traits

;; /g/'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_trait_sip010
(use-trait sip010-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; constants
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; /g/.aibtc-faktory/dao_contract_token
(define-constant DAO_TOKEN .aibtc-faktory)

;; error codes
(define-constant ERR_INVALID_DAO_TOKEN (err u2400))
(define-constant ERR_SWAP_FAILED (err u2401))
(define-constant ERR_QUOTE_FAILED (err u2402))
(define-constant ERR_SLIPPAGE_TOO_HIGH (err u2403))

;; public functions

(define-public (buy-and-deposit (daoToken <sip010-trait>) (amount uint) (minReceive (optional uint)))
(let (
      (daoTokenContract (contract-of daoToken))
      ;; /g/.aibtc-faktory-dex/dao_contract_token_dex
      (swapInInfo (unwrap! (contract-call? .aibtc-faktory-dex get-in amount) ERR_QUOTE_FAILED))
      (swapTokensOut (get tokens-out swapInInfo))
    )
    ;; verify token matches adapter config
    (asserts! (is-eq daoTokenContract DAO_TOKEN) ERR_INVALID_DAO_TOKEN)
    ;; if min-receive is set, check slippage
    (and
      (is-some minReceive)
      (asserts! (>= swapTokensOut (unwrap-panic minReceive))
        ERR_SLIPPAGE_TOO_HIGH
      )
    )
    ;; call faktory dex to perform the swap
    ;; /g/.aibtc-faktory-dex/dao_contract_token_dex
    (contract-call? .aibtc-faktory-dex buy daoToken amount)
  )
)
