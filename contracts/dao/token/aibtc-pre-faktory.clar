;; 99af7ff63e5e4bd7542e55d88bacc25a7a6f79004f9937ea0bab3ca4c2438061
;; aibtc.com DAO faktory.fun PRE @version 1.0
;; Pre-launch contract for token distribution
;; Dynamic allocation: 1-7 seats per user in Period 1
;; Each seat = 0.00020000 BTC, targeting 20 seats total with minimum 10 users

;; Pre-launch participants are co-deployers of the DAO contract infrastructure through 
;; a multi-sig and thus have legitimate claim to protocol fees generated by the DEX contract.
;; Fee airdrops are separate from token purchase and vesting.

(use-trait faktory-token 'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait) ;; STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A

(define-constant SEATS u20)
(define-constant MIN-USERS u10)
(define-constant MAX-SEATS-PER-USER u7)
(define-constant PRICE-PER-SEAT u20000) ;; 20K sats per seat
(define-constant TOKENS-PER-SEAT u200000000000000) ;; max_supply times 0.2%
(define-constant DEX-AMOUNT u250000)
(define-constant MULTI-SIG-AMOUNT u10000)
(define-constant FEE-AMOUNT u140000)

(define-constant FT-INITIALIZED-BALANCE u4000000000000000) ;; max_supply times 4%

;; Vesting schedule (percentages add up to 100)
(define-constant VESTING-SCHEDULE (list
  ;; Initial release - 10% at once
  {
    height: u100,
    percent: u10,
    id: u0,
  }
  ;; 10% at initial unlock
  ;; Second phase - 20% total across 6 drips
  {
    height: u250,
    percent: u3,
    id: u1,
  }
  ;; 3%
  {
    height: u400,
    percent: u3,
    id: u2,
  }
  ;; 3%
  {
    height: u550,
    percent: u3,
    id: u3,
  }
  ;; 3%
  {
    height: u700,
    percent: u3,
    id: u4,
  }
  ;; 3%
  {
    height: u850,
    percent: u4,
    id: u5,
  }
  ;; 4%
  {
    height: u1000,
    percent: u4,
    id: u6,
  }
  ;; 4% - hitting 30% total at original second milestone
  ;; Third phase - 30% total across 7 drips
  {
    height: u1200,
    percent: u4,
    id: u7,
  }
  ;; 4%
  {
    height: u1400,
    percent: u4,
    id: u8,
  }
  ;; 4%
  {
    height: u1600,
    percent: u4,
    id: u9,
  }
  ;; 4%
  {
    height: u1750,
    percent: u4,
    id: u10,
  }
  ;; 4%
  {
    height: u1900,
    percent: u4,
    id: u11,
  }
  ;; 4%
  {
    height: u2000,
    percent: u5,
    id: u12,
  }
  ;; 5%
  {
    height: u2100,
    percent: u5,
    id: u13,
  }
  ;; 5% - hitting 60% total at original third milestone
  ;; Final phase - 40% total across 7 drips
  {
    height: u2500,
    percent: u5,
    id: u14,
  }
  ;; 5%
  {
    height: u2900,
    percent: u5,
    id: u15,
  }
  ;; 5%
  {
    height: u3300,
    percent: u6,
    id: u16,
  }
  ;; 6%
  {
    height: u3600,
    percent: u6,
    id: u17,
  }
  ;; 6%
  {
    height: u3900,
    percent: u6,
    id: u18,
  }
  ;; 6%
  {
    height: u4100,
    percent: u6,
    id: u19,
  }
  ;; 6%
  {
    height: u4200,
    percent: u6,
    id: u20,
  }
))

;; 6% - hitting 100% total at original final milestone

(define-constant FAKTORY1 tx-sender) ;; if a multi-sig can create a multi-sig then this is a multi-sig 2 of 5
(define-constant FAKTORY2 tx-sender)

;; Data vars
(define-data-var ft-balance uint u0)
(define-data-var stx-balance uint u0)
(define-data-var total-seats-taken uint u0)
(define-data-var total-users uint u0)
(define-data-var distribution-height uint u0)
(define-data-var deployment-height uint burn-block-height)
(define-data-var accelerated-vesting bool false)
(define-data-var market-open bool false)
(define-data-var governance-active bool false)
(define-data-var acc-distributed uint u0)

;; Determined after multi-sig creation
;; /g/.aibtc-faktory/dao_contract_token
(define-constant TOKEN-DAO .aibtc-faktory) ;; param
;; /g/.aibtc-faktory-dex/dao_contract_token_dex
(define-constant DEX-DAO .aibtc-faktory-dex) ;; param

;; Define a data variable to track seat holders
(define-data-var seat-holders (list 20 {
  owner: principal,
  seats: uint,
}) (list))

;; Track seat ownership and claims
(define-map seats-owned
  principal
  uint
)
(define-map claimed-amounts
  principal
  uint
)

;; Error constants
(define-constant ERR-NO-SEATS-LEFT (err u301))
(define-constant ERR-NOT-SEAT-OWNER (err u302))
(define-constant ERR-NOTHING-TO-CLAIM (err u304))
(define-constant ERR-NOT-AUTHORIZED (err u305))
(define-constant ERR-WRONG-TOKEN (err u307))
(define-constant ERR-CONTRACT-INSUFFICIENT-FUNDS (err u311))
(define-constant ERR-INVALID-SEAT-COUNT (err u313))
(define-constant ERR-REMOVING-HOLDER (err u316))
(define-constant ERR-DISTRIBUTION-ALREADY-SET (err u320))
(define-constant ERR-DISTRIBUTION-NOT-INITIALIZED (err u321))

;; Helper function to update seat holders list
(define-private (update-seat-holder
    (owner principal)
    (seat-count uint)
  )
  (let (
      (current-holders (var-get seat-holders))
      (updated-list (update-or-add-holder current-holders owner seat-count))
    )
    (var-set seat-holders updated-list)
  )
)

;; Helper to update or add a holder to the list
(define-private (update-or-add-holder
    (holders (list 20 {
      owner: principal,
      seats: uint,
    }))
    (owner principal)
    (seat-count uint)
  )
  (let ((position (find-holder-position holders)))
    (if (is-some position)
      ;; Update existing holder - unwrap the optional result
      (unwrap-panic (replace-at? holders (unwrap-panic position) {
        owner: owner,
        seats: seat-count,
      }))
      ;; Add new holder
      (unwrap-panic (as-max-len?
        (append holders {
          owner: owner,
          seats: seat-count,
        })
        u20
      ))
    )
  )
)

;; Helper to find a holder's position in the list
(define-private (find-holder-position (holders (list 20 {
  owner: principal,
  seats: uint,
})))
  (let ((result (fold check-if-owner holders {
      found: false,
      index: u0,
    })))
    (if (get found result)
      (some (get index result))
      none
    )
  )
)

(define-private (check-if-owner
    (entry {
      owner: principal,
      seats: uint,
    })
    (state {
      found: bool,
      index: uint,
    })
  )
  (if (get found state)
    ;; Already found, just pass through
    state
    ;; Check if this is the owner we're looking for
    (if (is-eq (get owner entry) tx-sender)
      ;; Found it, update state
      {
        found: true,
        index: (get index state),
      }
      ;; Not found, increment counter
      {
        found: false,
        index: (+ (get index state) u1),
      }
    )
  )
)

(define-private (remove-seat-holder)
  (let ((filtered-list (filter not-matching-owner (var-get seat-holders))))
    (var-set seat-holders filtered-list)
    (ok true)
  )
)

(define-private (not-matching-owner (entry {
  owner: principal,
  seats: uint,
}))
  (not (is-eq (get owner entry) tx-sender))
)

;; Main functions
;; Buy seats in Period 1
(define-public (buy-up-to (seat-count uint))
  (let (
      (current-seats (var-get total-seats-taken))
      (user-seats (default-to u0 (map-get? seats-owned tx-sender)))
      (max-total-allowed (get-max-seats-allowed))
      (max-additional-allowed (if (>= (var-get total-users) MIN-USERS)
        max-total-allowed ;; if quota of users is attained, anyone can buy
        (if (>= user-seats max-total-allowed)
          u0
          (- max-total-allowed user-seats)
        )
      ))
      (actual-seats (if (> seat-count max-additional-allowed)
        max-additional-allowed
        seat-count
      ))
    )
    (asserts! (is-eq (var-get distribution-height) u0)
      ERR-DISTRIBUTION-ALREADY-SET
    )
    (asserts! (> actual-seats u0) ERR-INVALID-SEAT-COUNT)
    (asserts! (<= (+ user-seats actual-seats) MAX-SEATS-PER-USER)
      ERR-INVALID-SEAT-COUNT
    )
    (asserts! (< current-seats SEATS) ERR-NO-SEATS-LEFT)
    ;; Process payment
    ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
    (match (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token transfer
      (* PRICE-PER-SEAT actual-seats) tx-sender (as-contract tx-sender) none
    )
      success (begin
        (if (is-eq user-seats u0)
          (var-set total-users (+ (var-get total-users) u1))
          true
        )
        (map-set seats-owned tx-sender (+ user-seats actual-seats))
        (var-set total-seats-taken (+ current-seats actual-seats))
        (var-set stx-balance
          (+ (var-get stx-balance) (* PRICE-PER-SEAT actual-seats))
        )
        (update-seat-holder tx-sender (+ user-seats actual-seats))
        (if (and
            (>= (var-get total-users) MIN-USERS) ;; Check if we should set distribution height
            (>= (var-get total-seats-taken) SEATS)
          )
          (try! (initialize-token-distribution))
          true
        )
        (print {
          type: "buy-seats",
          buyer: tx-sender,
          seats-owned: (+ user-seats actual-seats),
          total-users: (var-get total-users),
          total-seats-taken: (+ current-seats actual-seats),
          stx-balance: (var-get stx-balance),
          seat-holders: (var-get seat-holders),
          distribution-height: (var-get distribution-height),
        })
        (ok true)
      )
      error (err error)
    )
  )
)

;; Refund logic only for Period 1 expired and Period 2 not started
(define-public (refund)
  (let (
      (user-seats (default-to u0 (map-get? seats-owned tx-sender)))
      (seat-owner tx-sender)
    )
    (asserts! (is-eq (var-get distribution-height) u0)
      ERR-DISTRIBUTION-ALREADY-SET
    )
    (asserts! (> user-seats u0) ERR-NOT-SEAT-OWNER)
    ;; Process refund
    ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
    (match (as-contract (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token transfer
      (* PRICE-PER-SEAT user-seats) tx-sender seat-owner none
    ))
      success (let ((is-removed (unwrap! (remove-seat-holder) ERR-REMOVING-HOLDER)))
        (map-delete seats-owned tx-sender)
        (var-set total-seats-taken (- (var-get total-seats-taken) user-seats))
        (var-set total-users (- (var-get total-users) u1))
        (var-set stx-balance
          (- (var-get stx-balance) (* PRICE-PER-SEAT user-seats))
        )
        (print {
          type: "refund",
          user: tx-sender,
          seats-refunded: user-seats,
          seat-holders: (var-get seat-holders),
          total-seats-taken: (var-get total-seats-taken),
          total-users: (var-get total-users),
          stx-balance: (var-get stx-balance),
        })
        (ok true)
      )
      error (err error)
    )
  )
)

(define-private (get-claimable-amount (owner principal))
  (begin
    (if (> (var-get distribution-height) u0)
      (let (
          (claimed (default-to u0 (map-get? claimed-amounts owner)))
          (seats-owner (default-to u0 (map-get? seats-owned owner)))
          (vested (fold check-claimable VESTING-SCHEDULE u0))
        )
        (- (* vested seats-owner) claimed)
      )
      ;; double claiming is impossible    
      u0
    )
  )
)

;; If distribution not initialized (equals u0), nothing is claimable

(define-private (check-claimable
    (entry {
      height: uint,
      percent: uint,
      id: uint,
    })
    (current-total uint)
  )
  (let ((distribution-start (var-get distribution-height)))
    (if (<= (+ distribution-start (get height entry)) burn-block-height)
      (+ current-total (/ (* TOKENS-PER-SEAT (get percent entry)) u100))
      (if (and
          (var-get accelerated-vesting) ;; token graduated, accelerated vesting
          (<= (get id entry) u13)
        )
        ;; we're in first 13 entries (0,1,2)
        (+ current-total (/ (* TOKENS-PER-SEAT (get percent entry)) u100))
        current-total
      )
    )
  )
)

;; Claim vested tokens
(define-public (claim (ft <faktory-token>))
  (let (
      (claimable (get-claimable-amount tx-sender))
      (seat-owner tx-sender)
    )
    (asserts! (> (var-get distribution-height) u0)
      ERR-DISTRIBUTION-NOT-INITIALIZED
    )
    (asserts! (is-eq (contract-of ft) TOKEN-DAO) ERR-WRONG-TOKEN)
    (asserts! (> (default-to u0 (map-get? seats-owned tx-sender)) u0)
      ERR-NOT-SEAT-OWNER
    )
    (asserts! (> claimable u0) ERR-NOTHING-TO-CLAIM)
    (asserts! (>= (var-get ft-balance) claimable) ERR-CONTRACT-INSUFFICIENT-FUNDS)
    (match (as-contract (contract-call? ft transfer claimable tx-sender seat-owner none))
      success (begin
        (map-set claimed-amounts tx-sender
          (+ (default-to u0 (map-get? claimed-amounts tx-sender)) claimable)
        )
        (var-set ft-balance (- (var-get ft-balance) claimable)) ;; reduce ft-balance by claimable
        (print {
          type: "claim",
          user: tx-sender,
          amount-claimed: claimable,
          total-claimed: (map-get? claimed-amounts tx-sender),
          ft-balance: (var-get ft-balance),
        })
        (ok claimable)
      )
      error (err error)
    )
  )
)

;; Claim vested tokens on behalf of a specific holder
(define-public (claim-on-behalf
    (ft <faktory-token>)
    (holder principal)
  )
  (let ((claimable (get-claimable-amount holder)))
    (asserts! (> (var-get distribution-height) u0)
      ERR-DISTRIBUTION-NOT-INITIALIZED
    )
    (asserts! (is-eq (contract-of ft) TOKEN-DAO) ERR-WRONG-TOKEN)
    (asserts! (> (default-to u0 (map-get? seats-owned holder)) u0)
      ERR-NOT-SEAT-OWNER
    )
    (asserts! (> claimable u0) ERR-NOTHING-TO-CLAIM)
    (asserts! (>= (var-get ft-balance) claimable) ERR-CONTRACT-INSUFFICIENT-FUNDS)
    (match (as-contract (contract-call? ft transfer claimable tx-sender holder none))
      success (begin
        (map-set claimed-amounts holder
          (+ (default-to u0 (map-get? claimed-amounts holder)) claimable)
        )
        (var-set ft-balance (- (var-get ft-balance) claimable))
        (print {
          type: "claim",
          user: holder,
          amount-claimed: claimable,
          total-claimed: (map-get? claimed-amounts holder),
          ft-balance: (var-get ft-balance),
        })
        (ok claimable)
      )
      error (err error)
    )
  )
)

;; Read only functions
(define-read-only (get-max-seats-allowed)
  (let (
      (total-users-now (var-get total-users))
      (seats-remaining (- SEATS (var-get total-seats-taken)))
      ;; Check if we've already met the minimum users requirement
      (users-remaining (if (>= total-users-now MIN-USERS)
        u0 ;; No more users needed
        (- MIN-USERS total-users-now)
      ))
      (max-possible (if (>= total-users-now MIN-USERS)
        seats-remaining ;; No more users needed
        (+ (- seats-remaining users-remaining) u1)
      ))
    )
    (if (>= max-possible MAX-SEATS-PER-USER)
      MAX-SEATS-PER-USER
      max-possible
    )
  )
)

(define-read-only (get-contract-status)
  (ok {
    is-distribution-period: (> (var-get distribution-height) u0),
    total-users: (var-get total-users),
    total-seats-taken: (var-get total-seats-taken),
    deployment-height: (var-get deployment-height),
    distribution-height: (var-get distribution-height),
    accelerated-vesting: (var-get accelerated-vesting),
    market-open: (var-get market-open),
    governance-active: (var-get governance-active),
    seat-holders: (var-get seat-holders),
  })
)

(define-read-only (get-user-info (user principal))
  (ok {
    seats-owned: (default-to u0 (map-get? seats-owned user)),
    amount-claimed: (default-to u0 (map-get? claimed-amounts user)),
    claimable-amount: (get-claimable-amount user),
  })
)

(define-read-only (get-remaining-seats)
  (ok { remaining-seats: (- SEATS (var-get total-seats-taken)) })
)

(define-read-only (get-seats-owned (address principal))
  (ok { seats-owned: (default-to u0 (map-get? seats-owned address)) })
)

(define-read-only (get-claimed-amount (address principal))
  (ok { claimed-amount: (default-to u0 (map-get? claimed-amounts address)) })
)

(define-read-only (get-vesting-schedule)
  (ok { vesting-schedule: VESTING-SCHEDULE })
)

(define-read-only (get-seat-holders)
  (ok { seat-holders: (var-get seat-holders) })
)

(define-read-only (is-market-open)
  (ok (var-get market-open))
)

(define-read-only (is-governance-active)
  (ok (var-get governance-active))
)

;; on pre-launch successful completion
(define-private (initialize-token-distribution)
  (begin
    (var-set market-open true)
    (var-set governance-active true)
    ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
    (try! (as-contract (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token transfer
      DEX-AMOUNT tx-sender DEX-DAO none
    )))
    ;; 0.00250000 BTC to DEX  
    ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
    (try! (as-contract (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token transfer
      MULTI-SIG-AMOUNT tx-sender FAKTORY1 none
    )))
    ;; 0.00010000 BTC  -> covers contract deployment gaz fees
    ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
    (try! (as-contract (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token transfer
      FEE-AMOUNT tx-sender FAKTORY2 none
    )))
    ;; 0.00140000 BTC fees -> covers ordinals bot, xlink and faktory
    (var-set distribution-height burn-block-height)
    (var-set last-airdrop-height (some burn-block-height))
    (var-set ft-balance FT-INITIALIZED-BALANCE) ;; 40M tokens
    (var-set stx-balance u0)
    (print {
      type: "distribution-initialized",
      token-contract: TOKEN-DAO,
      distribution-height: burn-block-height,
      ft-balance: FT-INITIALIZED-BALANCE,
    })
    (ok true)
  )
)

;; on Bonding
(define-public (toggle-bonded)
  (begin
    (asserts! (is-eq contract-caller DEX-DAO) ERR-NOT-AUTHORIZED)
    (var-set accelerated-vesting true)
    (var-set final-airdrop-mode true)
    (print {
      type: "bonded",
      token-contract: TOKEN-DAO,
      bonded-height: burn-block-height,
    })
    (ok true)
  )
)

;; Simplified Fee Distribution System
;; Constants
(define-constant COOLDOWN-PERIOD u2100) ;; Longer cooldown between airdrops

;; Error constants
(define-constant ERR-NO-FEES-TO-DISTRIBUTE (err u323))
(define-constant ERR-COOLDOWN-ACTIVE (err u324))
(define-constant ERR-TOTAL-SEATS-ZERO (err u325))

;; Data vars for fee tracking
(define-data-var accumulated-fees uint u0) ;; Total fees accumulated since last airdrop
(define-data-var last-airdrop-height (optional uint) (some u0)) ;; Block height of the last airdrop
(define-data-var final-airdrop-mode bool false) ;; Toggle for final airdrop mode

;; Add this function to allow the DEX to send fees to the contract
(define-public (create-fees-receipt (amount uint))
  (let ((current-fees (var-get accumulated-fees)))
    ;; Only the DEX contract can call this function
    (asserts! (is-eq contract-caller DEX-DAO) ERR-NOT-AUTHORIZED)
    ;; Update accumulated fees
    (var-set accumulated-fees (+ current-fees amount))
    (print {
      type: "fees-received",
      amount: amount,
      total-accumulated: (+ current-fees amount),
    })
    (ok true)
  )
)

;; Check if airdrop can be triggered
(define-read-only (can-trigger-airdrop)
  (let (
      (cooldown-expired (>= burn-block-height
        (+ (unwrap-panic (var-get last-airdrop-height)) COOLDOWN-PERIOD)
      ))
      (has-fees (> (var-get accumulated-fees) u0))
      (final-mode (var-get final-airdrop-mode))
    )
    (or
      (and cooldown-expired has-fees)
      (and final-mode has-fees)
    )
  )
)

;; Main airdrop function - anyone can call
(define-public (trigger-fee-airdrop)
  (let (
      (total-fees (var-get accumulated-fees))
      (total-seats (var-get total-seats-taken))
      (can-airdrop (can-trigger-airdrop))
      (acc-fees (var-get accumulated-fees))
    )
    ;; Check if airdrop can be triggered
    (asserts! can-airdrop
      (if (> total-fees u0)
        ERR-COOLDOWN-ACTIVE
        ERR-NO-FEES-TO-DISTRIBUTE
      ))
    ;; Must have fees to distribute and seats must exist
    (asserts! (> total-fees u0) ERR-NO-FEES-TO-DISTRIBUTE)
    (asserts! (> total-seats u0) ERR-TOTAL-SEATS-ZERO)
    ;; Distribute fees to all seat holders
    (var-set acc-distributed u0)
    (let ((distributions (map distribute-to-holder (var-get seat-holders))))
      (if (> (- acc-fees (var-get acc-distributed)) u0)
        ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
        (match (as-contract (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token
          transfer (- acc-fees (var-get acc-distributed)) tx-sender FAKTORY1
          none
        ))
          success (begin
            (print {
              type: "fee-residual",
              recipient: FAKTORY1,
              amount: (- acc-fees (var-get acc-distributed)),
            })
            true
          )
          error
          false
        )
        true
      )
      ;; Reset accumulated fees and update last airdrop height
      (var-set accumulated-fees u0)
      (var-set last-airdrop-height (some burn-block-height))
      (print {
        type: "fee-airdrop",
        total-distributed: total-fees,
        timestamp: burn-block-height,
        distributions: distributions,
      })
      (ok total-fees)
    )
  )
)

;; Helper function to distribute fees to a single holder
(define-private (distribute-to-holder (entry {
  owner: principal,
  seats: uint,
}))
  (let (
      (holder (get owner entry))
      (user-seats (get seats entry))
      (total-seats (var-get total-seats-taken))
      (total-fees (var-get accumulated-fees))
      (user-share (if (and (> user-seats u0) (> total-seats u0))
        (/ (* total-fees user-seats) total-seats)
        u0
      ))
    )
    ;; Only distribute if the user's share is greater than zero
    (if (> user-share u0)
      ;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
      (match (as-contract (contract-call? 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token
        transfer user-share tx-sender holder none
      ))
        success (begin
          (var-set acc-distributed (+ (var-get acc-distributed) user-share))
          {
            recipient: holder,
            amount: user-share,
          }
        )
        error
        {
          recipient: holder,
          amount: u0,
        }
      )
      {
        recipient: holder,
        amount: u0,
      }
    )
  )
)

;; Get all unique seat holders
(define-read-only (get-all-seat-holders)
  (ok (var-get seat-holders))
)

;; Get fee distribution info for UI
(define-read-only (get-fee-distribution-info)
  (ok {
    accumulated-fees: (var-get accumulated-fees),
    last-airdrop-height: (var-get last-airdrop-height),
    current-height: burn-block-height,
    cooldown-period: COOLDOWN-PERIOD,
    final-airdrop-mode: (var-get final-airdrop-mode),
    can-trigger-now: (can-trigger-airdrop),
  })
)

;; Get user's expected share in the next airdrop
(define-read-only (get-user-expected-share (user principal))
  (let (
      (user-seats (default-to u0 (map-get? seats-owned user)))
      (total-seats (var-get total-seats-taken))
      (total-fees (var-get accumulated-fees))
    )
    (ok {
      user: user,
      user-seats: user-seats,
      total-seats: total-seats,
      total-accumulated-fees: total-fees,
      expected-share: (if (and
          (> user-seats u0)
          (> total-seats u0)
          (> total-fees u0)
        )
        (/ (* total-fees user-seats) total-seats)
        u0
      ),
    })
  )
)
