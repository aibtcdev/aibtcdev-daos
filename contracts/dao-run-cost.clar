;; title: dao-run-cost
;; version: 1.0.0
;; summary: A contract that holds and manages fees for AIBTC services.

;; funds are transferred to this contract every time a proposal is created
;; will be a mix of several different dao tokens over time
;; only allows withdrawal with 3-of-5 approval from an approved list of addresses
;; an approved address can add/remove other addresses with quorum

;; constants
;;

;; error messages
(define-constant ERR_NOT_OWNER (err u1000))
(define-constant ERR_ALREADY_CONFIRMED (err u1001))

;; possible actions
(define-constant SET_OWNER u1)
(define-constant SET_ASSET u2)

;; data vars
;;

(define-data-var confirmationId uint u0)
(define-data-var confirmationsRequired uint u3) ;; 3 of 5

;; data maps
;;

(define-map Owners principal bool)
(define-map OwnerConfirmations { id: uint, nonce: uint, owner: principal } bool)
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

;; will accept trait to use for contract transfer
;; we should maintain an allowed assets list too
(define-public (transfer-dao-token) (ok true))

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

;; private functions
;;

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
