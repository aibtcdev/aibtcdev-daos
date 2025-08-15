;; title: aibtc-rewards-account
;; version: 2.0.0
;; summary: A smart contract that holds funds used for proposal rewards.

;; traits
;;

;; /g/.aibtc-dao-traits.extension/dao_trait_extension
(impl-trait .aibtc-dao-traits.extension)
;; /g/.aibtc-dao-traits.rewards-account/dao_trait_rewards_account
(impl-trait .aibtc-dao-traits.rewards-account)

;; /g/'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_trait_sip010
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; constants
;;

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u1700))

;; contract details
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; public functions
;;

(define-public (callback
    (sender principal)
    (memo (buff 34))
  )
  (ok true)
)

(define-public (transfer-reward
    (recipient principal)
    (amount uint)
  )
  (begin
    (try! (is-dao-or-extension))
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-rewards-account/transfer-reward",
      payload: {
        recipient: recipient,
        amount: amount,
        contractCaller: contract-caller,
        txSender: tx-sender,
      },
    })
    ;; /g/.aibtc-faktory/dao_contract_token
    (as-contract (contract-call? .aibtc-faktory transfer amount SELF recipient none))
  )
)

;; private functions
;;

(define-private (is-dao-or-extension)
  (ok (asserts!
    (or
      ;; /g/.aibtc-base-dao/dao_contract_base
      (is-eq tx-sender .aibtc-base-dao)
      ;; /g/.aibtc-base-dao/dao_contract_base
      (contract-call? .aibtc-base-dao is-extension contract-caller)
    )
    ERR_NOT_DAO_OR_EXTENSION
  ))
)
