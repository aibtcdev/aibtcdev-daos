;; title: aibtc-dao-run-cost
;; version: 1.0.0
;; summary: A contract that holds and manages fees for AIBTC services.

;; funds are transferred to this contract every time a proposal is created
;; will be a mix of several different dao tokens over time
;;
;; only allows withdrawal with 3-of-N approval from an approved list of addresses
;; an approved address can add/remove other addresses with quorum

;; traits
;;

;; /g/'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_trait_sip010
(use-trait sip010-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; constants
;;

;; error messages
(define-constant ERR_NOT_OWNER (err u1000))
(define-constant ERR_ASSET_NOT_ALLOWED (err u1001))

;; contract details
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; possible actions
(define-constant SET_OWNER u1)
(define-constant SET_ASSET u2)
(define-constant TRANSFER u3)
(define-constant SET_CONFIRMATIONS u4)

;; proposal expiration
(define-constant PROPOSAL_EXPIRATION u48) ;; 48 blocks / 8 hours

;; data vars
;;

;; 3 of N confirmations required
(define-data-var confirmationsRequired uint u3)

;; variables to track total proposals, used for nonces
(define-data-var setOwnerProposalsTotal uint u0)
(define-data-var setAssetProposalsTotal uint u0)
(define-data-var transferProposalsTotal uint u0)
(define-data-var setConfirmationsProposalsTotal uint u0)

;; data maps
;;

(define-map Owners
  principal ;; owner
  bool ;; enabled
)

(define-map SetOwnerProposals
  uint ;; nonce
  {
    who: principal, ;; owner
    status: bool, ;; enabled
    executed: bool, ;; executed
    created: uint, ;; block height
  }
)

(define-map SetAssetProposals
  uint ;; nonce
  {
    token: principal, ;; asset contract
    enabled: bool, ;; enabled
    created: uint, ;; block height
  }
)

(define-map TransferProposals
  uint ;; nonce
  {
    ft: principal, ;; asset contract
    amount: uint, ;; amount
    to: principal, ;; recipient
    created: uint, ;; block height
  }
)

(define-map SetConfirmationsProposals
  uint ;; nonce
  {
    required: uint, ;; new confirmation threshold
    executed: bool, ;; executed
    created: uint, ;; block height
  }
)

(define-map OwnerConfirmations
  {
    id: uint, ;; action id
    nonce: uint, ;; action nonce
    owner: principal, ;; owner
  }
  bool ;; confirmed
)

(define-map TotalConfirmations
  {
    id: uint, ;; action id
    nonce: uint, ;; action nonce
  }
  uint ;; total confirmations
)

(define-map AllowedAssets
  principal ;; asset contract
  bool ;; enabled
)

;; public functions
;;

(define-public (set-owner
    (nonce uint)
    (who principal)
    (status bool)
  )
  (begin
    (asserts! (is-owner contract-caller) ERR_NOT_OWNER)
    (var-set setOwnerProposalsTotal (+ (var-get setOwnerProposalsTotal) u1))
    (map-insert SetOwnerProposals nonce {
      who: who,
      status: status,
      executed: false,
      created: burn-block-height,
    })
    (print {
      notification: "dao-run-cost/set-owner",
      payload: {
        nonce: nonce,
        who: who,
        status: status,
        contractCaller: contract-caller,
        txSender: tx-sender,
      },
    })
    (ok (and (is-confirmed SET_OWNER nonce) (execute-set-owner nonce)))
  )
)

(define-public (set-asset
    (nonce uint)
    (token principal)
    (enabled bool)
  )
  (begin
    (asserts! (is-owner contract-caller) ERR_NOT_OWNER)
    (var-set setAssetProposalsTotal (+ (var-get setAssetProposalsTotal) u1))
    (map-insert SetAssetProposals nonce {
      token: token,
      enabled: enabled,
      created: burn-block-height,
    })
    (print {
      notification: "dao-run-cost/set-asset",
      payload: {
        nonce: nonce,
        token: token,
        enabled: enabled,
        contractCaller: contract-caller,
        txSender: tx-sender,
      },
    })
    (ok (and (is-confirmed SET_ASSET nonce) (execute-set-asset nonce)))
  )
)

(define-public (transfer-dao-token
    (nonce uint)
    (ft <sip010-trait>)
    (amount uint)
    (to principal)
  )
  (begin
    (asserts! (is-owner contract-caller) ERR_NOT_OWNER)
    (asserts! (is-allowed-asset (contract-of ft)) ERR_ASSET_NOT_ALLOWED)
    (var-set transferProposalsTotal (+ (var-get transferProposalsTotal) u1))
    (map-insert TransferProposals nonce {
      ft: (contract-of ft),
      amount: amount,
      to: to,
      created: burn-block-height,
    })
    (print {
      notification: "dao-run-cost/transfer-dao-token",
      payload: {
        nonce: nonce,
        amount: amount,
        recipient: to,
        assetContract: (contract-of ft),
        contractCaller: contract-caller,
        txSender: tx-sender,
      },
    })
    (ok (and (is-confirmed TRANSFER nonce) (execute-transfer nonce ft)))
  )
)

(define-public (set-confirmations
    (nonce uint)
    (required uint)
  )
  (begin
    (asserts! (is-owner contract-caller) ERR_NOT_OWNER)
    (var-set setConfirmationsProposalsTotal
      (+ (var-get setConfirmationsProposalsTotal) u1)
    )
    (map-insert SetConfirmationsProposals nonce {
      required: required,
      executed: false,
      created: burn-block-height,
    })
    (print {
      notification: "dao-run-cost/set-confirmations",
      payload: {
        nonce: nonce,
        required: required,
        contractCaller: contract-caller,
        txSender: tx-sender,
      },
    })
    (ok (and (is-confirmed SET_CONFIRMATIONS nonce) (execute-set-confirmations nonce)))
  )
)

;; read only functions
;;

(define-read-only (get-confirmations-required)
  (var-get confirmationsRequired)
)

(define-read-only (get-proposal-totals)
  {
    setOwner: (var-get setOwnerProposalsTotal),
    setAsset: (var-get setAssetProposalsTotal),
    transfer: (var-get transferProposalsTotal),
    setConfirmations: (var-get setConfirmationsProposalsTotal),
  }
)

(define-read-only (is-owner (who principal))
  (default-to false (map-get? Owners who))
)

(define-read-only (get-set-owner-proposal (nonce uint))
  (map-get? SetOwnerProposals nonce)
)

(define-read-only (get-set-asset-proposal (nonce uint))
  (map-get? SetAssetProposals nonce)
)

(define-read-only (get-transfer-proposal (nonce uint))
  (map-get? TransferProposals nonce)
)

(define-read-only (get-set-confirmations-proposal (nonce uint))
  (map-get? SetConfirmationsProposals nonce)
)

(define-read-only (get-owner-confirmations
    (id uint)
    (nonce uint)
  )
  (map-get? OwnerConfirmations {
    id: id,
    nonce: nonce,
    owner: contract-caller,
  })
)

(define-read-only (owner-has-confirmed
    (id uint)
    (nonce uint)
    (who principal)
  )
  (default-to false
    (map-get? OwnerConfirmations {
      id: id,
      nonce: nonce,
      owner: who,
    })
  )
)

(define-read-only (get-total-confirmations
    (id uint)
    (nonce uint)
  )
  (default-to u0
    (map-get? TotalConfirmations {
      id: id,
      nonce: nonce,
    })
  )
)

(define-read-only (get-allowed-asset (assetContract principal))
  (map-get? AllowedAssets assetContract)
)

(define-read-only (is-allowed-asset (assetContract principal))
  (default-to false (get-allowed-asset assetContract))
)

(define-read-only (get-contract-info)
  {
    self: SELF,
    deployedBurnBlock: DEPLOYED_BURN_BLOCK,
    deployedStacksBlock: DEPLOYED_STACKS_BLOCK,
  }
)

;; private functions
;;

;; tracks confirmations for a given action
(define-private (is-confirmed
    (id uint)
    (nonce uint)
  )
  (let ((confirmations (+ (get-total-confirmations id nonce)
      (if (owner-has-confirmed id nonce contract-caller)
        u0
        u1
      ))))
    (map-set OwnerConfirmations {
      id: id,
      nonce: nonce,
      owner: contract-caller,
    }
      true
    )
    (map-set TotalConfirmations {
      id: id,
      nonce: nonce,
    }
      confirmations
    )
    (is-eq confirmations (var-get confirmationsRequired))
  )
)

(define-private (can-execute (height uint))
  (>= height (+ burn-block-height PROPOSAL_EXPIRATION))
)

(define-private (execute-set-owner (nonce uint))
  (let (
      (proposal (map-get? SetOwnerProposals nonce))
      (proposalDetails (unwrap! proposal false))
    )
    (asserts! (can-execute (get created proposalDetails)) false)
    (asserts! (is-some proposal) false)
    (asserts! (is-eq (get executed proposalDetails) false) false)
    (map-set SetOwnerProposals nonce {
      who: (get who proposalDetails),
      status: (get status proposalDetails),
      executed: true,
      created: burn-block-height,
    })
    (print {
      notification: "dao-run-cost/execute-set-owner",
      payload: {
        nonce: nonce,
        who: (get who proposalDetails),
        status: (get status proposalDetails),
        executed: true,
        created: (get created proposalDetails),
        contractCaller: contract-caller,
        txSender: tx-sender,
      },
    })
    (map-set Owners (get who proposalDetails) (get status proposalDetails))
  )
)

(define-private (execute-set-asset (nonce uint))
  (let (
      (proposal (map-get? SetAssetProposals nonce))
      (proposalDetails (unwrap! proposal false))
    )
    (asserts! (can-execute (get created proposalDetails)) false)
    (asserts! (is-some proposal) false)
    (print {
      notification: "dao-run-cost/execute-set-asset",
      payload: {
        nonce: nonce,
        token: (get token proposalDetails),
        enabled: (get enabled proposalDetails),
        created: (get created proposalDetails),
        contractCaller: contract-caller,
        txSender: tx-sender,
      },
    })
    (map-set AllowedAssets (get token proposalDetails)
      (get enabled proposalDetails)
    )
  )
)

(define-private (execute-transfer
    (nonce uint)
    (ft <sip010-trait>)
  )
  (let (
      (proposal (map-get? TransferProposals nonce))
      (proposalDetails (unwrap! proposal false))
    )
    (asserts! (can-execute (get created proposalDetails)) false)
    (asserts! (is-some proposal) false)
    (print {
      notification: "dao-run-cost/execute-transfer",
      payload: {
        nonce: nonce,
        amount: (get amount proposalDetails),
        recipient: (get to proposalDetails),
        assetContract: (get ft proposalDetails),
        created: (get created proposalDetails),
        contractCaller: contract-caller,
        txSender: tx-sender,
      },
    })
    (unwrap!
      (as-contract (contract-call? ft transfer (get amount proposalDetails) SELF
        (get to proposalDetails) none
      ))
      false
    )
  )
)

(define-private (execute-set-confirmations (nonce uint))
  (let (
      (proposal (map-get? SetConfirmationsProposals nonce))
      (proposalDetails (unwrap! proposal false))
    )
    (asserts! (can-execute (get created proposalDetails)) false)
    (asserts! (is-some proposal) false)
    (asserts! (is-eq (get executed proposalDetails) false) false)
    (map-set SetConfirmationsProposals nonce {
      required: (get required proposalDetails),
      executed: true,
      created: burn-block-height,
    })
    (print {
      notification: "dao-run-cost/execute-set-confirmations",
      payload: {
        nonce: nonce,
        required: (get required proposalDetails),
        executed: true,
        created: (get created proposalDetails),
        contractCaller: contract-caller,
        txSender: tx-sender,
      },
    })
    (var-set confirmationsRequired (get required proposalDetails))
  )
)

(begin
  (map-set Owners 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM true)
  (map-set Owners 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 true)
  (map-set Owners 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG true)
  (map-set Owners 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC true)
  (map-set Owners 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND true)
  (print (get-contract-info))
)
