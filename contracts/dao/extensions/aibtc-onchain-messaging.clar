;; title: aibtc-onchain-messaging
;; version: 1.0.0
;; summary: An extension to send messages on-chain to anyone listening to this contract.

;; traits
;;
(impl-trait .aibtc-dao-traits.extension)
(impl-trait .aibtc-dao-traits.messaging)

;; constants
;;
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u4000))
(define-constant ERR_INVALID_INPUT (err u4001))
(define-constant ERR_FETCHING_TOKEN_DATA (err u4002))

;; public functions

(define-public (callback (sender principal) (memo (buff 34))) (ok true))

(define-public (send (msg (string-ascii 1047888)))
  (let
    (
      (isFromDao (is-ok (is-dao-or-extension)))
      (senderBalance (unwrap! (contract-call? .aibtc-token get-balance tx-sender) ERR_FETCHING_TOKEN_DATA))
      (isFromHolder (> senderBalance u0))
    )
    ;; check there is a message
    (asserts! (> (len msg) u0) ERR_INVALID_INPUT)
    ;; print the envelope and message
    (print {
      notification: "aibtc-onchain-messaging/send",
      payload: {
        contractCaller: contract-caller,
        txSender: tx-sender,
        height: stacks-block-height,
        isFromDao: isFromDao,
        isFromHolder: isFromHolder,
        messageLength: (len msg),
        message: msg,
      }
    })
    (ok true)
  )
)

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtc-base-dao)
    (contract-call? .aibtc-base-dao is-extension contract-caller)) ERR_NOT_DAO_OR_EXTENSION
  ))
)
