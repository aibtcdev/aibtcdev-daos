;; title: protocol-fees-account
;; version: 1.0.0
;; summary: A contract that holds and manages protocol fees for AIBTC services.

;; funds are transferred to this contract every time a proposal is created
;; will be a mix of several different dao tokens over time
;; only allows withdrawal with 3-of-5 approval from an approved list of addresses
;; an approved address can add/remove other addresses

;; constants
;;

;; error messages
(define-constant ERR_NOT_OWNER (err u1000))

;; data vars
;;

(define-data-var signalsRequired uint u3) ;; 3 of 5

;; data maps
;;

(define-map Owners principal bool)

;; public functions
;;

(define-public (set-owner (who principal) (status bool))
  (begin
    (asserts! (is-owner contract-caller) ERR_NOT_OWNER)
    (print {
      notification: "protocol-fees-account/set-owner",
      payload: {
        who: who,
        status: status,
        contractCaller: contract-caller,
        txSender: tx-sender
      }
    })
    (ok (map-set Owners who status))
  )
)

;; will accept trait to use for contract transfer
;; we should maintain an approved assets list too
(define-public (transfer-dao-token) (ok true))

;; read only functions
;;

;; private functions
;;

(define-private (is-owner (who principal))
  (default-to false (map-get? Owners who))
)
