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
(define-constant PRICE_PER_SEAT u20000)

;; error codes
(define-constant ERR_INVALID_DAO_TOKEN (err u2400))
(define-constant ERR_INVALID_AMOUNT (err u2401))
(define-constant ERR_QUOTE_FAILED (err u2402))
(define-constant ERR_SLIPPAGE_TOO_HIGH (err u2403))
(define-constant ERR_REFUNDING_SEATS (err u2404))

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
      ;; /g/.aibtc-faktory-dex/dao_contract_token_dex
      (swapInInfo (unwrap! (contract-call? .aibtc-faktory-dex get-in amount) ERR_QUOTE_FAILED))
      (daoTokensReceived (get tokens-out swapInInfo))
    )
    ;; verify token matches adapter config
    (asserts! (is-eq daoTokenContract DAO_TOKEN) ERR_INVALID_DAO_TOKEN)
    ;; verify amount is positive
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
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
        ;; transfer sBTC to this contract to perform the buy
        ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
        (try! (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token
          transfer amount sender SELF none
        ))
        ;; buy DAO tokens as this contract to receive DAO tokens
        ;; /g/.aibtc-faktory-dex/dao_contract_token_dex
        (try! (as-contract (contract-call? .aibtc-faktory-dex buy daoToken amount)))
        ;; transfer DAO tokens to agent account
        (try! (as-contract (contract-call? daoToken transfer daoTokensReceived SELF account none)))
        ;; return (ok uint) with amount transferred
        (ok daoTokensReceived)
      )
      ;; no agent account, call faktory dex directly to perform the swap
      (begin
        ;; /g/.aibtc-faktory-dex/dao_contract_token_dex
        (try! (contract-call? .aibtc-faktory-dex buy daoToken amount))
        (ok daoTokensReceived)
      )
    )
  )
)

(define-public (buy-seats-and-deposit (amount uint))
  (let (
      (sender tx-sender)
      ;; /g/.agent-account-registry/faktory_agent_account_registry
      (agentAccount (contract-call? .agent-account-registry get-agent-account-by-owner sender))
      (maxSeats (/ amount PRICE_PER_SEAT))
    )
    (asserts! (>= amount PRICE_PER_SEAT) ERR_INVALID_AMOUNT)
    ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
    (try! (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token transfer
      amount sender SELF none
    ))
    (match agentAccount
      ;; agent account found
      account
      (buy-seats-and-handle-change amount maxSeats account)
      ;; no agent account
      (buy-seats-and-handle-change amount maxSeats sender)
    )
  )
)

(define-private (buy-seats-and-handle-change
    (amount uint)
    (maxSeats uint)
    (recipient principal)
  )
  (match
    ;; /g/.aibtc-pre-faktory/dao_contract_token_prelaunch
    (as-contract (contract-call? .aibtc-pre-faktory buy-up-to maxSeats (some recipient)))
    seatsReceived
    (let ((changeToUser (- amount (* seatsReceived PRICE_PER_SEAT))))
      (and
        (> changeToUser u0)
        ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
        (try! (as-contract (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token
          transfer changeToUser SELF recipient none
        )))
      )
      (ok seatsReceived)
    )
    ;; error
    errorCode
    (begin
      ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
      (try! (as-contract (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token
        transfer amount SELF recipient none
      )))
      (ok amount)
    )
  )
)

(define-public (refund-seat-and-deposit)
  (let (
      (sender tx-sender)
      ;; /g/.agent-account-registry/faktory_agent_account_registry
      (agentAccount (contract-call? .agent-account-registry get-agent-account-by-owner sender))
    )
    (match agentAccount
      ;; agent account found
      account
      ;; /g/.aibtc-pre-faktory/dao_contract_token_prelaunch
      (ok (unwrap! (contract-call? .aibtc-pre-faktory refund (some account))
        ERR_REFUNDING_SEATS
      ))
      ;; no agent account
      ;; /g/.aibtc-pre-faktory/dao_contract_token_prelaunch
      (ok (unwrap! (contract-call? .aibtc-pre-faktory refund (some sender))
        ERR_REFUNDING_SEATS
      ))
    )
  )
)

;; read-only functions

(define-read-only (get-contract-info)
  {
    self: SELF,
    deployedBurnBlock: DEPLOYED_BURN_BLOCK,
    deployedStacksBlock: DEPLOYED_STACKS_BLOCK,
    daoToken: DAO_TOKEN,
    pricePerSeat: PRICE_PER_SEAT,
    ;; /g/.agent-account-registry/faktory_agent_account_registry
    agentAccountRegistry: .agent-account-registry,
    ;; /g/.aibtc-faktory-dex/dao_contract_token_dex
    swapContract: .aibtc-faktory-dex,
    ;; /g/.aibtc-pre-faktory/dao_contract_token_prelaunch
    daoTokenPrelaunch: .aibtc-pre-faktory,
  }
)
