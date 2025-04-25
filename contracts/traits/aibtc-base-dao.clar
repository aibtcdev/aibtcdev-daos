;; title: aibtc-dao
;; version: 3.0.0
;; summary: A trait that defines an aibtc base dao.

(use-trait proposal-trait .aibtc-dao-traits-v3.proposal)
(use-trait extension-trait .aibtc-dao-traits-v3.extension)

(define-trait aibtc-base-dao (
    ;; Execute a governance proposal
    (execute (<proposal-trait> principal) (response bool uint))
    ;; Enable or disable an extension contract
    (set-extension (principal bool) (response bool uint))
    ;; Request extension callback
    (request-extension-callback (<extension-trait> (buff 34)) (response bool uint))
))
