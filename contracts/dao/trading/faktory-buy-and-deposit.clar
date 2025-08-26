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

(define-public (buy-and-deposit
    (daoToken <sip010-trait>)
    (amount uint)
    (minReceive (optional uint))
  )
  (let (
      (caller contract-caller)
      ;; /g/.agent-account-registry/faktory_agent_account_registry
      (agentAccount (contract-call? .agent-account-registry get-agent-account-by-owner caller))
      (daoTokenContract (contract-of daoToken))
      ;; /g/.aibtc-faktory-dex/dao_contract_token_dex
      (swapInInfo (unwrap! (contract-call? .aibtc-faktory-dex get-in amount) ERR_QUOTE_FAILED))
      (daoTokensReceived (get tokens-out swapInInfo))
    )
    ;; verify token matches adapter config
    (asserts! (is-eq daoTokenContract DAO_TOKEN) ERR_INVALID_DAO_TOKEN)
    ;; if minReceive is set, check slippage
    (and
      (is-some minReceive)
      (asserts! (>= daoTokensReceived (unwrap-panic minReceive))
        ERR_SLIPPAGE_TOO_HIGH
      )
    )
    ;; take an action depending on if we found agent account
    (match agentAccount
      ;; agent account found
      account
      (begin
        ;; transfer sBTC to this contract
        ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
        (try! (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token
          transfer amount caller SELF none
        ))
        ;; buy as this contract to receive DAO tokens
        (try! (as-contract (contract-call? .aibtc-faktory-dex buy daoToken amount)))
        ;; transfer DAO tokens to agent account
        (try! (as-contract (contract-call? daoToken transfer daoTokensReceived SELF account none)))
        ;; return (ok uint) same as bitflow
        (ok daoTokensReceived)
      )
      ;; no agent account, call faktory dex to perform the swap
      ;; /g/.aibtc-faktory-dex/dao_contract_token_dex
      (begin
        (try! (contract-call? .aibtc-faktory-dex buy daoToken amount))
        (ok daoTokensReceived)
      )
    )
  )
)
