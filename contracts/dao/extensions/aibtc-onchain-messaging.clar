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
(define-constant ERR_INVALID_INPUT (err u1600))
(define-constant ERR_FETCHING_TOKEN_DATA (err u1601))

;; data-vars
(define-data-var messageCost uint u0)

;; public functions

(define-public (callback
    (sender principal)
    (memo (buff 34))
  )
  (ok true)
)

;; DAO itself can send messages via proposals
;; DAO token holders can send messages by paying a fee
(define-public (send (msg (string-utf8 10000)))
  (let (
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
        isFromDao: false,
        isFromHolder: isFromHolder,
        messageLength: (len msg),
        message: msg,
      },
    })
    ;; transfer the message cost to the dao
    ;; /g/.aibtc-treasury/dao_contract_treasury
    ;; /g/.aibtc-faktory/dao_contract_token
    (contract-call? .aibtc-treasury deposit-ft .aibtc-faktory
      (var-get messageCost)
    )
  )
)


;; initialization
;;

(let (
    ;; /g/.aibtc-action-proposal-voting/dao_contract_action_proposal_voting
    (proposalConfig (contract-call? .aibtc-action-proposal-voting get-voting-configuration))
    (bondAmount (get proposalBond proposalConfig))
  )
  (print {
    notification: "aibtc-onchain-messaging/initialize",
    payload: {
      contractCaller: contract-caller,
      txSender: tx-sender,
      messageCost: bondAmount,
    },
  })
  (ok (var-set messageCost bondAmount))
)
