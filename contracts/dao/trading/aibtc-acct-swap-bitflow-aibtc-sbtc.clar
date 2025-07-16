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
(define-constant ERR_SWAP_FAILED (err u2301))
(define-constant ERR_MIN_RECEIVE_REQUIRED (err u2302))

;; data vars

(define-data-var totalBuys uint u0)
(define-data-var totalSells uint u0)

;; public functions

(define-public (buy-dao-token
    (daoToken <sip010-trait>)
    (amount uint)
    (minReceive (optional uint))
  )
  (let ((daoTokenContract (contract-of daoToken)))
    (asserts! (is-eq daoTokenContract DAO_TOKEN) ERR_INVALID_DAO_TOKEN)
    (asserts! (is-some minReceive) ERR_MIN_RECEIVE_REQUIRED)
    ;; /g/.xyk-core-v-1-2/external_bitflow_core
    (match (contract-call? .xyk-core-v-1-2
      ;; /g/.xyk-pool-sbtc-aibtc-v-1-1/dao_contract_bitflow_pool
      swap-x-for-y .xyk-pool-sbtc-aibtc-v-1-1 daoToken SBTC_TOKEN amount
      (unwrap-panic minReceive)
    )
      success (ok (var-set totalBuys (+ (var-get totalBuys) u1)))
      error
      ;; ERR_SWAP_FAILED
      (begin 
      (print {
        notification: "Swap failed",
        payload: {
          daoToken: daoTokenContract,
          amount: amount,
          minReceive: (unwrap-panic minReceive),
          error: error,
        },
      })
      (ok true))
    )
  )
)

(define-public (sell-dao-token
    (daoToken <sip010-trait>)
    (amount uint)
    (minReceive (optional uint))
  )
  (begin
    (asserts! (is-eq (contract-of daoToken) DAO_TOKEN) ERR_INVALID_DAO_TOKEN)
    (asserts! (is-some minReceive) ERR_MIN_RECEIVE_REQUIRED)
    ;; /g/.xyk-core-v-1-2/external_bitflow_core
    (match (contract-call? .xyk-core-v-1-2
      ;; /g/.xyk-pool-sbtc-aibtc-v-1-1/dao_contract_bitflow_pool
      swap-y-for-x .xyk-pool-sbtc-aibtc-v-1-1 daoToken SBTC_TOKEN amount
      (unwrap-panic minReceive)
    )
      success (ok (var-set totalSells (+ (var-get totalSells) u1)))
      error
      ;; ERR_SWAP_FAILED
      (begin 
      (print {
        notification: "Swap failed",
        payload: {
          daoToken: daoToken,
          amount: amount,
          minReceive: (unwrap-panic minReceive),
          error: error,
        },
      })
      (ok true))
    )
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

(define-read-only (get-swap-info)
  {
    totalBuys: (var-get totalBuys),
    totalSells: (var-get totalSells),
    totalSwaps: (+ (var-get totalBuys) (var-get totalSells)),
  }
)
