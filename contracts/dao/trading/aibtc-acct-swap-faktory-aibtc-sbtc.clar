;; /g/aibtc/dao_token_symbol
;; title: aibtc-acct-swap-faktory-aibtc-sbtc
;; version: 1.0.0
;; /g/aibtc/dao_token_symbol
;; summary: Adapter to trade aibtc:sbtc on the Faktory DEX with an agent account.

;; traits

;; /g/.aibtc-agent-account-traits.aibtc-dao-swap-adapter/agent_account_trait_dao_swap_adapter
(impl-trait .aibtc-agent-account-traits.aibtc-dao-swap-adapter)
;; /g/'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_trait_sip010
(use-trait sip010-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; constants
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; /g/.aibtc-faktory/dao_contract_token
(define-constant DAO_TOKEN .aibtc-faktory)

;; error codes
(define-constant ERR_INVALID_DAO_TOKEN (err u2200))
(define-constant ERR_SWAP_FAILED (err u2201))
(define-constant ERR_QUOTE_FAILED (err u2202))
(define-constant ERR_SLIPPAGE_TOO_HIGH (err u2203))

;; data vars

(define-data-var totalBuys uint u0)
(define-data-var totalSells uint u0)

;; public functions

(define-public (buy-dao-token
    (daoToken <sip010-trait>)
    (amount uint)
    (minReceive (optional uint))
  )
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
    (match (contract-call? .aibtc-faktory-dex buy daoToken amount)
      success (ok (var-set totalBuys (+ (var-get totalBuys) u1)))
      error
      ERR_SWAP_FAILED
    )
  )
)

(define-public (sell-dao-token
    (daoToken <sip010-trait>)
    (amount uint)
    (minReceive (optional uint))
  )
  (let (
      (daoTokenContract (contract-of daoToken))
      ;; /g/.aibtc-faktory-dex/dao_contract_token_dex
      (swapOutInfo (unwrap! (contract-call? .aibtc-faktory-dex get-out amount)
        ERR_QUOTE_FAILED
      ))
      (swapTokensIn (get amount-in swapOutInfo))
    )
    ;; verify token matches adapter config
    (asserts! (is-eq daoTokenContract DAO_TOKEN) ERR_INVALID_DAO_TOKEN)
    ;; if min-receive is set, check slippage
    (and
      (is-some minReceive)
      (asserts! (>= swapTokensIn (unwrap-panic minReceive)) ERR_SLIPPAGE_TOO_HIGH)
    )
    ;; call faktory dex to perform the swap
    ;; /g/.aibtc-faktory-dex/dao_contract_token_dex
    (match (contract-call? .aibtc-faktory-dex sell daoToken amount)
      success (ok (var-set totalSells (+ (var-get totalSells) u1)))
      error
      ERR_SWAP_FAILED
    )
  )
)

;; read-only functions

(define-read-only (get-contract-info)
  {
    self: SELF,
    deployedBurnBlock: DEPLOYED_BURN_BLOCK,
    deployedStacksBlock: DEPLOYED_STACKS_BLOCK,
    ;; /g/.aibtc-faktory-dex/dao_contract_token_dex
    swapContract: .aibtc-faktory-dex,
    daoToken: DAO_TOKEN,
  }
)

(define-read-only (get-swap-info)
  {
    totalBuys: (var-get totalBuys),
    totalSells: (var-get totalSells),
    totalSwaps: (+ (var-get totalBuys) (var-get totalSells)),
  }
)
