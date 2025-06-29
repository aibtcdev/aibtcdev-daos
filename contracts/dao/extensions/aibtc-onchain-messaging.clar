;; title: aibtc-onchain-messaging
;; version: 1.0.0
;; summary: An extension to send messages on-chain to anyone listening to this contract.

;; traits
;;

;; /g/.aibtc-dao-traits.extension/dao_trait_extension
(impl-trait .aibtc-dao-traits.extension)
;; /g/.aibtc-dao-traits.messaging/dao_trait_messaging
(impl-trait .aibtc-dao-traits.messaging)

;; constants
;;
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u1600))
(define-constant ERR_INVALID_INPUT (err u1601))
(define-constant ERR_FETCHING_TOKEN_DATA (err u1602))

;; public functions

(define-public (callback
    (sender principal)
    (memo (buff 34))
  )
  (ok true)
)

(define-public (send (msg (string-utf8 10000)))
  (let (
      (isFromDao (is-ok (is-dao-or-extension)))
      ;; /g/.aibtc-faktory/dao_contract_token
      (senderBalance (unwrap! (contract-call? .aibtc-faktory get-balance tx-sender)
        ERR_FETCHING_TOKEN_DATA
      ))
      (isFromHolder (> senderBalance u0))
    )
    ;; check there is a message
    (asserts! (> (len msg) u0) ERR_INVALID_INPUT)
    ;; print the envelope and message
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-onchain-messaging/send",
      payload: {
        contractCaller: contract-caller,
        txSender: tx-sender,
        height: stacks-block-height,
        isFromDao: isFromDao,
        isFromHolder: isFromHolder,
        messageLength: (len msg),
        message: msg,
      },
    })
    (ok true)
  )
)

;; private functions
;;

(define-private (is-dao-or-extension)
  ;; /g/.aibtc-base-dao/dao_contract_base
  (ok (asserts!
    (or
      (is-eq tx-sender .aibtc-base-dao)
      ;; /g/.aibtc-base-dao/dao_contract_base
      (contract-call? .aibtc-base-dao is-extension contract-caller)
    )
    ERR_NOT_DAO_OR_EXTENSION
  ))
)
