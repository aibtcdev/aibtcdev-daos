;; title: aibtc-agent-account
;; version: 1.0.0
;; summary: A special account contract between a user and an agent for managing assets and DAO interactions. Only the user can withdraw funds.

;; traits
;; /g/.aibtc-agent-account-traits.aibtc-account/agent_account_trait_account
(impl-trait .aibtc-agent-account-traits.aibtc-account)
;; /g/.aibtc-agent-account-traits.aibtc-proposals/agent_account_trait_proposals
(impl-trait .aibtc-agent-account-traits.aibtc-proposals)
;; /g/.aibtc-agent-account-traits.faktory-dex-approval/agent_account_trait_faktory_dex_approval
(impl-trait .aibtc-agent-account-traits.faktory-dex-approval)
;; /g/.aibtc-agent-account-traits.faktory-buy-sell/agent_account_trait_faktory_buy_sell
(impl-trait .aibtc-agent-account-traits.faktory-buy-sell)
;; /g/'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_trait_sip010
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
;; /g/.aibtc-dao-traits.action/dao_trait_action
(use-trait action-trait .aibtc-dao-traits.action)
;; /g/.aibtc-dao-traits.proposal/dao_trait_proposal
(use-trait proposal-trait .aibtc-dao-traits.proposal)
;; /g/.aibtc-dao-traits.action-proposal-voting/dao_trait_action_proposal_voting
(use-trait action-proposal-voting-trait .aibtc-dao-traits.action-proposal-voting)
;; /g/.aibtc-dao-traits.faktory-dex/dao_trait_faktory_dex
(use-trait dao-faktory-dex .aibtc-dao-traits.faktory-dex)
;; /g/'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait/dao_trait_faktory_token
(use-trait faktory-token 'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait)

;; constants
(define-constant DEPLOYED_BURN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)
(define-constant SELF (as-contract tx-sender))

;; owner and agent addresses
;; /g/'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/account_owner
(define-constant ACCOUNT_OWNER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM) ;; owner (user/creator of account, full access)
;; /g/'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG/account_agent
(define-constant ACCOUNT_AGENT 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG) ;; agent (can only take approved actions)

;; pre-approved contracts
;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
(define-constant SBTC_TOKEN 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token) ;; sBTC token
;; /g/.aibtc-faktory/dao_contract_token
(define-constant DAO_TOKEN .aibtc-faktory) ;; DAO token
;; /g/.aibtc-faktory-dex/dao_contract_token_dex
(define-constant DAO_TOKEN_DEX .aibtc-faktory-dex) ;; DAO token DEX

;; error codes
(define-constant ERR_UNAUTHORIZED (err u1100))
(define-constant ERR_UNKNOWN_ASSET (err u1101))
(define-constant ERR_OPERATION_FAILED (err u1102))
(define-constant ERR_BUY_SELL_NOT_ALLOWED (err u1103))

;; data maps
(define-map ApprovedAssets
  principal
  bool
)
(define-map ApprovedDexes
  principal
  bool
)

;; data vars
(define-data-var agentCanBuySell bool false)

;; public functions

;; Asset Management Functions

(define-public (deposit-stx (amount uint))
  (begin
    (print {
      notification: "aibtc-agent-account/deposit-stx",
      payload: {
        contractCaller: contract-caller,
        txSender: tx-sender,
        amount: amount,
        recipient: SELF,
      },
    })
    (stx-transfer? amount contract-caller SELF)
  )
)

(define-public (deposit-ft
    (ft <ft-trait>)
    (amount uint)
  )
  (begin
    (asserts! (is-approved-asset (contract-of ft)) ERR_UNKNOWN_ASSET)
    (print {
      notification: "aibtc-agent-account/deposit-ft",
      payload: {
        amount: amount,
        assetContract: (contract-of ft),
        sender: tx-sender,
        caller: contract-caller,
        recipient: SELF,
      },
    })
    (contract-call? ft transfer amount contract-caller SELF none)
  )
)

(define-public (withdraw-stx (amount uint))
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (print {
      notification: "aibtc-agent-account/withdraw-stx",
      payload: {
        amount: amount,
        sender: SELF,
        caller: contract-caller,
        recipient: ACCOUNT_OWNER,
      },
    })
    (as-contract (stx-transfer? amount SELF ACCOUNT_OWNER))
  )
)

(define-public (withdraw-ft
    (ft <ft-trait>)
    (amount uint)
  )
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (asserts! (is-approved-asset (contract-of ft)) ERR_UNKNOWN_ASSET)
    (print {
      notification: "aibtc-agent-account/withdraw-ft",
      payload: {
        amount: amount,
        assetContract: (contract-of ft),
        sender: SELF,
        caller: contract-caller,
        recipient: ACCOUNT_OWNER,
      },
    })
    (as-contract (contract-call? ft transfer amount SELF ACCOUNT_OWNER none))
  )
)

(define-public (approve-asset (asset principal))
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (print {
      notification: "aibtc-agent-account/approve-asset",
      payload: {
        asset: asset,
        approved: true,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (ok (map-set ApprovedAssets asset true))
  )
)

(define-public (revoke-asset (asset principal))
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (print {
      notification: "aibtc-agent-account/revoke-asset",
      payload: {
        asset: asset,
        approved: false,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (ok (map-set ApprovedAssets asset false))
  )
)

;; DAO Interaction Functions

(define-public (create-action-proposal
    (voting-contract <action-proposal-voting-trait>)
    (action <action-trait>)
    (parameters (buff 2048))
    (memo (optional (string-ascii 1024)))
  )
  (begin
    (asserts! (is-authorized) ERR_UNAUTHORIZED)
    (print {
      notification: "aibtc-agent-account/create-action-proposal",
      payload: {
        proposalContract: (contract-of voting-contract),
        action: (contract-of action),
        parameters: parameters,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (as-contract (contract-call? voting-contract create-action-proposal action parameters memo))
  )
)

(define-public (vote-on-action-proposal
    (voting-contract <action-proposal-voting-trait>)
    (proposalId uint)
    (vote bool)
  )
  (begin
    (asserts! (is-authorized) ERR_UNAUTHORIZED)
    (print {
      notification: "aibtc-agent-account/vote-on-action-proposal",
      payload: {
        proposalContract: (contract-of voting-contract),
        proposalId: proposalId,
        vote: vote,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (as-contract (contract-call? voting-contract vote-on-action-proposal proposalId vote))
  )
)

(define-public (veto-action-proposal
    (voting-contract <action-proposal-voting-trait>)
    (proposalId uint)
  )
  (begin
    (asserts! (is-authorized) ERR_UNAUTHORIZED)
    (print {
      notification: "aibtc-agent-account/veto-action-proposal",
      payload: {
        proposalContract: (contract-of voting-contract),
        proposalId: proposalId,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (as-contract (contract-call? voting-contract veto-action-proposal proposalId))
  )
)

(define-public (conclude-action-proposal
    (voting-contract <action-proposal-voting-trait>)
    (proposalId uint)
    (action <action-trait>)
  )
  (begin
    (asserts! (is-authorized) ERR_UNAUTHORIZED)
    (print {
      notification: "aibtc-agent-account/conclude-action-proposal",
      payload: {
        proposalContract: (contract-of voting-contract),
        proposalId: proposalId,
        action: (contract-of action),
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (as-contract (contract-call? voting-contract conclude-action-proposal proposalId action))
  )
)

;; Faktory DEX Trading Functions

(define-public (acct-buy-asset
    (faktory-dex <dao-faktory-dex>)
    (asset <faktory-token>)
    (amount uint)
  )
  (begin
    (asserts! (buy-sell-allowed) ERR_BUY_SELL_NOT_ALLOWED)
    (asserts! (is-approved-dex (contract-of faktory-dex)) ERR_UNKNOWN_ASSET)
    (print {
      notification: "aibtc-agent-account/acct-buy-asset",
      payload: {
        dexContract: (contract-of faktory-dex),
        asset: (contract-of asset),
        amount: amount,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (as-contract (contract-call? faktory-dex buy asset amount))
  )
)

(define-public (acct-sell-asset
    (faktory-dex <dao-faktory-dex>)
    (asset <faktory-token>)
    (amount uint)
  )
  (begin
    (asserts! (buy-sell-allowed) ERR_BUY_SELL_NOT_ALLOWED)
    (asserts! (is-approved-dex (contract-of faktory-dex)) ERR_UNKNOWN_ASSET)
    (print {
      notification: "aibtc-agent-account/acct-sell-asset",
      payload: {
        dexContract: (contract-of faktory-dex),
        asset: (contract-of asset),
        amount: amount,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (as-contract (contract-call? faktory-dex sell asset amount))
  )
)

(define-public (acct-approve-dex (faktory-dex <dao-faktory-dex>))
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (print {
      notification: "aibtc-agent-account/acct-approve-dex",
      payload: {
        dexContract: (contract-of faktory-dex),
        approved: true,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (ok (map-set ApprovedDexes (contract-of faktory-dex) true))
  )
)

(define-public (acct-revoke-dex (faktory-dex <dao-faktory-dex>))
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (print {
      notification: "aibtc-agent-account/acct-revoke-dex",
      payload: {
        dexContract: (contract-of faktory-dex),
        approved: false,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (ok (map-set ApprovedDexes (contract-of faktory-dex) false))
  )
)

(define-public (set-agent-can-buy-sell (canBuySell bool))
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (print {
      notification: "aibtc-agent-account/set-agent-can-buy-sell",
      payload: {
        canBuySell: canBuySell,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (ok (var-set agentCanBuySell canBuySell))
  )
)

;; read only functions

(define-read-only (is-approved-asset (asset principal))
  (default-to false (map-get? ApprovedAssets asset))
)

(define-read-only (is-approved-dex (dex principal))
  (default-to false (map-get? ApprovedDexes dex))
)

(define-read-only (get-configuration)
  {
    account: SELF,
    agent: ACCOUNT_AGENT,
    owner: ACCOUNT_OWNER,
    daoToken: DAO_TOKEN,
    daoTokenDex: DAO_TOKEN_DEX,
    sbtcToken: SBTC_TOKEN,
  }
)

;; private functions

(define-private (is-authorized)
  (or (is-eq contract-caller ACCOUNT_OWNER) (is-eq contract-caller ACCOUNT_AGENT))
)

(define-private (is-owner)
  (is-eq contract-caller ACCOUNT_OWNER)
)

(define-private (is-agent)
  (is-eq contract-caller ACCOUNT_AGENT)
)

(define-private (buy-sell-allowed)
  (or (is-owner) (and (is-agent) (var-get agentCanBuySell)))
)

(begin
  ;; initialize approved contracts
  (map-set ApprovedAssets SBTC_TOKEN true)
  (map-set ApprovedAssets DAO_TOKEN true)
  (map-set ApprovedDexes DAO_TOKEN_DEX true)
  ;; print creation event
  (print {
    notification: "aibtc-agent-account/user-agent-account-created",
    payload: (get-configuration),
  })
)
