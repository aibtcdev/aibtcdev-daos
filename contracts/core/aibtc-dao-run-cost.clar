;; title: aibtc-dao-run-cost
;; version: 1.0.0
;; summary: A contract that holds and manages fees for AIBTC services.

;; funds are transferred to this contract every time a proposal is created
;; will be a mix of several different dao tokens over time
;;
;; only allows withdrawal with 3-of-5 approval from an approved list of addresses
;; an approved address can add/remove other addresses with quorum

;; traits
;;

;; /g/'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_sip010_trait
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

;; data vars
;;

(define-data-var confirmationId uint u0)
(define-data-var confirmationsRequired uint u3) ;; 3 of 5

;; data maps
;;

(define-map Owners principal bool)
(define-map OwnerConfirmations { id: uint, nonce: uint, owner: principal } bool)
(define-map ConfirmationNonces { id: uint, nonce: uint } bool)
(define-map TotalConfirmations { id: uint, nonce: uint } uint)
(define-map AllowedAssets principal bool)

;; public functions
;;

(define-public (set-owner (nonce uint) (who principal) (status bool))
  (begin
    (asserts! (is-owner contract-caller) ERR_NOT_OWNER)
    (print {
      notification: "dao-run-cost/set-owner",
      payload: {
        who: who,
        status: status,
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    (ok (and (is-confirmed SET_OWNER nonce) (map-set Owners who status)))
  )
)

(define-public (set-asset (nonce uint) (token principal) (enabled bool))
  (begin
    (asserts! (is-owner contract-caller) ERR_NOT_OWNER)
    (print {
      notification: "dao-run-cost/set-asset",
      payload: {
        token: token,
        enabled: enabled,
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    (ok (and (is-confirmed SET_ASSET nonce) (map-set AllowedAssets token enabled)))
  )
)

(define-public (transfer-dao-token (nonce uint) (ft <sip010-trait>) (amount uint) (to principal))
  (begin
    (asserts! (is-owner contract-caller) ERR_NOT_OWNER)
    (asserts! (is-allowed-asset (contract-of ft)) ERR_ASSET_NOT_ALLOWED)
    (print {
      notification: "dao-run-cost/transfer-dao-token",
      payload: {
        amount: amount,
        recipient: to,
        assetContract: (contract-of ft),
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    (ok (and (is-confirmed TRANSFER nonce) (try! (as-contract (contract-call? ft transfer amount SELF to none)))))
  )
)

;; read only functions
;;

(define-read-only (is-owner (who principal))
  (default-to false (map-get? Owners who))
)

(define-read-only (get-current-id)
  (var-get confirmationId)
)

(define-read-only (get-confirmations-required)
  (var-get confirmationsRequired)
)

(define-read-only (has-confirmed (id uint) (nonce uint) (who principal))
  (default-to false (map-get? OwnerConfirmations { id: id, nonce: nonce, owner: who }))
)

(define-read-only (get-confirmations (id uint) (nonce uint))
  (default-to u0 (map-get? TotalConfirmations { id: id, nonce: nonce }))
)

(define-read-only (is-allowed-asset (assetContract principal))
  (default-to false (get-allowed-asset assetContract))
)

(define-read-only (get-allowed-asset (assetContract principal))
  (map-get? AllowedAssets assetContract)
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

;; TODO: needs nonce tracking (last nonce per ID) to prevent arbitrary values
;; or a better way to track confirmations for each action
(define-private (is-confirmed (id uint) (nonce uint))
  (let
    (
      (confirmations (+ (get-confirmations id nonce) (if (has-confirmed id nonce contract-caller) u0 u1)))
    )
    (map-set OwnerConfirmations { id: id, nonce: nonce, owner: contract-caller } true)
    (map-set TotalConfirmations { id: id, nonce: nonce } confirmations)
    (is-eq confirmations (var-get confirmationsRequired))
  )
)

(map-set Owners contract-caller true)