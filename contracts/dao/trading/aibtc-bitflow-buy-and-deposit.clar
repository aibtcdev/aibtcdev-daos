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
(define-constant ERR_INVALID_AMOUNT (err u2501))
(define-constant ERR_MIN_RECEIVE_REQUIRED (err u2502))

;; public functions

(define-public (buy-and-deposit
    (daoToken <sip010-trait>)
    (amount uint)
    (minReceive (optional uint))
  )
  (let (
      (sender tx-sender)
      ;; /g/.agent-account-registry/faktory_agent_account_registry
      (agentAccount (contract-call? .agent-account-registry get-agent-account-by-owner sender))
      (daoTokenContract (contract-of daoToken))
      (minReceiveVal (unwrap! minReceive ERR_MIN_RECEIVE_REQUIRED))
    )
    ;; verify token matches adapter config
    (asserts! (is-eq daoTokenContract DAO_TOKEN) ERR_INVALID_DAO_TOKEN)
    ;; verify amount is positive
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    ;; take an action depending on if we found agent account
    (match agentAccount
      ;; agent account found
      account
      (let (
          ;; transfer sBTC to this contract to perform the buy
          ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
          (sbtcTransfer (try! (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token
            transfer amount sender SELF none
          )))
          ;; buy tokens as contract, capture total received in output
          (daoTokensReceived (try! (as-contract (contract-call? .xyk-core-v-1-2 swap-x-for-y .xyk-pool-sbtc-aibtc-v-1-1
            SBTC_TOKEN daoToken amount minReceiveVal
          ))))
        )
        ;; transfer DAO tokens to agent account
        (try! (as-contract (contract-call? daoToken transfer daoTokensReceived SELF account none)))
        (ok daoTokensReceived)
      )
      ;; no agent account, call bitflow pool to perform the swap
      ;; /g/.xyk-core-v-1-2/external_bitflow_core
      ;; /g/.xyk-pool-sbtc-aibtc-v-1-1/dao_contract_bitflow_pool
      (ok (try! (contract-call? .xyk-core-v-1-2 swap-x-for-y .xyk-pool-sbtc-aibtc-v-1-1
        SBTC_TOKEN daoToken amount minReceiveVal
      )))
    )
  )
)

;; read-only functions

(define-read-only (get-contract-info)
  {
    self: SELF,
    deployedBurnBlock: DEPLOYED_BURN_BLOCK,
    deployedStacksBlock: DEPLOYED_STACKS_BLOCK,
    ;; /g/.agent-account-registry/faktory_agent_account_registry
    agentAccountRegistry: .agent-account-registry,
    ;; /g/.aibtc-faktory-dex/dao_contract_token_dex
    swapContract: .aibtc-faktory-dex,
    daoToken: DAO_TOKEN,
    sbtcToken: SBTC_TOKEN,
  }
)
