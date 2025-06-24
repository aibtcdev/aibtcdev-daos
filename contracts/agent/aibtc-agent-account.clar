;; title: aibtc-agent-account
;; version: 2.0.0
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

;; error codes
(define-constant ERR_UNAUTHORIZED (err u1100))
(define-constant ERR_CONTRACT_NOT_APPROVED (err u1101))
(define-constant ERR_OPERATION_FAILED (err u1102))
(define-constant ERR_BUY_SELL_NOT_ALLOWED (err u1103))

;; data maps
(define-map ApprovedContracts
  principal
  bool
)

;; data vars
(define-data-var agentCanUseProposals bool false)
(define-data-var agentCanApproveRevokeContracts bool false)
(define-data-var agentCanBuySellTokens bool false)

;; public functions

;; anyone can deposit STX to this contract
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

;; anyone can deposit FT to this contract if the asset contract is approved
(define-public (deposit-ft
    (ft <ft-trait>)
    (amount uint)
  )
  (begin
    (asserts! (is-approved-contract (contract-of ft)) ERR_CONTRACT_NOT_APPROVED)
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

;; only the owner can withdraw STX from this contract
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

;; only the owner can withdraw FT from this contract if the asset contract is approved
(define-public (withdraw-ft
    (ft <ft-trait>)
    (amount uint)
  )
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (asserts! (is-approved-contract (contract-of ft)) ERR_CONTRACT_NOT_APPROVED)
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

;; the owner or the agent (if enabled) can approve a contract for use with the agent account
(define-public (approve-contract (contract principal))
  (begin
    (asserts! (approve-revoke-contract-allowed) ERR_UNAUTHORIZED)
    (print {
      notification: "aibtc-agent-account/approve-contract",
      payload: {
        contract: contract,
        approved: true,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (ok (map-set ApprovedContracts contract true))
  )
)

;; the owner or the agent (if enabled) can revoke a contract from use with the agent account
(define-public (revoke-contract (contract principal))
  (begin
    (asserts! (approve-revoke-contract-allowed) ERR_UNAUTHORIZED)
    (print {
      notification: "aibtc-agent-account/revoke-contract",
      payload: {
        contract: contract,
        approved: false,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (ok (map-set ApprovedContracts contract false))
  )
)

;; DAO Interaction Functions

;; the owner or the agent (if enabled) can create proposals if the proposal voting contract is approved
(define-public (create-action-proposal
    (votingContract <action-proposal-voting-trait>)
    (action <action-trait>)
    (parameters (buff 2048))
    (memo (optional (string-ascii 1024)))
  )
  (begin
    (asserts! (use-proposals-allowed) ERR_UNAUTHORIZED)
    (asserts! (is-approved-contract (contract-of votingContract))
      ERR_CONTRACT_NOT_APPROVED
    )
    (print {
      notification: "aibtc-agent-account/create-action-proposal",
      payload: {
        proposalContract: (contract-of votingContract),
        action: (contract-of action),
        parameters: parameters,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (as-contract (contract-call? votingContract create-action-proposal action parameters memo))
  )
)

;; the owner or the agent (if enabled) can vote on action proposals if the proposal voting contract is approved
(define-public (vote-on-action-proposal
    (votingContract <action-proposal-voting-trait>)
    (proposalId uint)
    (vote bool)
  )
  (begin
    (asserts! (use-proposals-allowed) ERR_UNAUTHORIZED)
    (asserts! (is-approved-contract (contract-of votingContract))
      ERR_CONTRACT_NOT_APPROVED
    )
    (print {
      notification: "aibtc-agent-account/vote-on-action-proposal",
      payload: {
        proposalContract: (contract-of votingContract),
        proposalId: proposalId,
        vote: vote,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (as-contract (contract-call? votingContract vote-on-action-proposal proposalId vote))
  )
)

;; the owner or the agent (if enabled) can veto action proposals if the proposal voting contract is approved
(define-public (veto-action-proposal
    (votingContract <action-proposal-voting-trait>)
    (proposalId uint)
  )
  (begin
    (asserts! (use-proposals-allowed) ERR_UNAUTHORIZED)
    (asserts! (is-approved-contract (contract-of votingContract))
      ERR_CONTRACT_NOT_APPROVED
    )
    (print {
      notification: "aibtc-agent-account/veto-action-proposal",
      payload: {
        proposalContract: (contract-of votingContract),
        proposalId: proposalId,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (as-contract (contract-call? votingContract veto-action-proposal proposalId))
  )
)

;; the owner or the agent (if enabled) can conclude action proposals if the proposal voting contract is approved
(define-public (conclude-action-proposal
    (votingContract <action-proposal-voting-trait>)
    (proposalId uint)
    (action <action-trait>)
  )
  (begin
    (asserts! (use-proposals-allowed) ERR_UNAUTHORIZED)
    (asserts! (is-approved-contract (contract-of votingContract))
      ERR_CONTRACT_NOT_APPROVED
    )
    (print {
      notification: "aibtc-agent-account/conclude-action-proposal",
      payload: {
        proposalContract: (contract-of votingContract),
        proposalId: proposalId,
        action: (contract-of action),
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (as-contract (contract-call? votingContract conclude-action-proposal proposalId action))
  )
)

;; Faktory DEX Trading Functions

;; the owner or the agent (if enabled) can buy assets on the Faktory DEX if the DEX contract is approved
;; requires sBTC to be deposited in the agent account
(define-public (faktory-buy-asset
    (faktory-dex <dao-faktory-dex>)
    (asset <faktory-token>)
    (amount uint)
  )
  (begin
    (asserts! (buy-sell-tokens-allowed) ERR_BUY_SELL_NOT_ALLOWED)
    (asserts! (is-approved-contract (contract-of faktory-dex))
      ERR_CONTRACT_NOT_APPROVED
    )
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

;; the owner or the agent (if enabled) can sell assets on the Faktory DEX if the DEX contract is approved
;; requires the asset to be deposited in the agent account
(define-public (faktory-sell-asset
    (faktory-dex <dao-faktory-dex>)
    (asset <faktory-token>)
    (amount uint)
  )
  (begin
    (asserts! (buy-sell-tokens-allowed) ERR_BUY_SELL_NOT_ALLOWED)
    (asserts! (is-approved-contract (contract-of faktory-dex))
      ERR_CONTRACT_NOT_APPROVED
    )
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

;; Agent Account Configuration Functions

;; the owner can set whether the agent can use proposals
(define-public (set-agent-can-use-proposals (canUseProposals bool))
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (print {
      notification: "aibtc-agent-account/set-agent-can-use-proposals",
      payload: {
        canUseProposals: canUseProposals,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (ok (var-set agentCanUseProposals canUseProposals))
  )
)

;; the owner can set whether the agent can approve/revoke contracts
(define-public (set-agent-can-approve-revoke-contracts (canApproveRevokeContracts bool))
  (begin
    (asserts! (is-owner) ERR_UNAUTHORIZED)
    (print {
      notification: "aibtc-agent-account/set-agent-can-approve-revoke-contracts",
      payload: {
        canApproveRevokeContracts: canApproveRevokeContracts,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (ok (var-set agentCanApproveRevokeContracts canApproveRevokeContracts))
  )
)

;; the owner can set whether the agent can buy/sell tokens
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
    (ok (var-set agentCanBuySellTokens canBuySell))
  )
)

;; read only functions

(define-read-only (is-approved-contract (contract principal))
  (default-to false (map-get? ApprovedContracts contract))
)

(define-read-only (get-configuration)
  {
    account: SELF,
    agent: ACCOUNT_AGENT,
    owner: ACCOUNT_OWNER,
  }
)

;; private functions

(define-private (is-owner)
  (is-eq contract-caller ACCOUNT_OWNER)
)

(define-private (is-agent)
  (is-eq contract-caller ACCOUNT_AGENT)
)

(define-private (is-authorized)
  (or (is-owner) (is-agent))
)

(define-private (use-proposals-allowed)
  (or (is-owner) (and (is-agent) (var-get agentCanUseProposals)))
)

(define-private (approve-revoke-contract-allowed)
  (or (is-owner) (and (is-agent) (var-get agentCanApproveRevokeContracts)))
)

(define-private (buy-sell-tokens-allowed)
  (or (is-owner) (and (is-agent) (var-get agentCanBuySellTokens)))
)

(begin
  ;; print creation event
  (print {
    notification: "aibtc-agent-account/user-agent-account-created",
    payload: (get-configuration),
  })
)
