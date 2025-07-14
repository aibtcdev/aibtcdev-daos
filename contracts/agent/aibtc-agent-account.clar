;; title: aibtc-agent-account
;; version: 3.0.0
;; summary: A special account contract between a user and an agent for managing assets and DAO interactions. Only the user can withdraw funds.

;; traits
;; /g/.aibtc-agent-account-traits.aibtc-account/agent_account_trait_account
(impl-trait .aibtc-agent-account-traits.aibtc-account)
;; /g/.aibtc-agent-account-traits.aibtc-account-proposals/agent_account_trait_proposals
(impl-trait .aibtc-agent-account-traits.aibtc-account-proposals)
;; /g/.aibtc-agent-account-traits.aibtc-account-config/agent_account_trait_account_config
(impl-trait .aibtc-agent-account-traits.aibtc-account-config)
;; /g/.aibtc-agent-account-traits.aibtc-account-swaps/agent_account_trait_account_swaps
(impl-trait .aibtc-agent-account-traits.aibtc-account-swaps)
;; /g/'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait/base_trait_sip010
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
;; /g/.aibtc-agent-account-traits.aibtc-dao-swap-adapter/agent_account_trait_dao_swap_adapter
(use-trait dao-swap-adapter .aibtc-agent-account-traits.aibtc-dao-swap-adapter)
;; /g/.aibtc-agent-account
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

;; /g/'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token/base_contract_sbtc
(define-constant SBTC_TOKEN 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token) ;; sBTC token

;; error codes
(define-constant ERR_CALLER_NOT_OWNER (err u1100))
(define-constant ERR_CONTRACT_NOT_APPROVED (err u1101))
(define-constant ERR_OPERATION_NOT_ALLOWED (err u1103))

;; data maps
(define-map ApprovedContracts
  principal
  bool
)

;; insert sBTC token into approved contracts
(map-set ApprovedContracts SBTC_TOKEN true)

;; data vars
(define-data-var agentCanDepositAssets bool true)
(define-data-var agentCanUseProposals bool true)
(define-data-var agentCanApproveRevokeContracts bool true)
(define-data-var agentCanBuySellAssets bool false)

;; public functions

;; the owner or agent can deposit STX to this contract
(define-public (deposit-stx (amount uint))
  (begin
    (asserts! (deposit-allowed) ERR_OPERATION_NOT_ALLOWED)
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

;; the owner or agent can deposit FT to this contract which will approve the asset contract
(define-public (deposit-ft
    (ft <ft-trait>)
    (amount uint)
  )
  (begin
    (asserts! (deposit-allowed) ERR_OPERATION_NOT_ALLOWED)
    (print {
      notification: "aibtc-agent-account/deposit-ft",
      payload: {
        amount: amount,
        assetContract: (contract-of ft),
        txSender: tx-sender,
        contractCaller: contract-caller,
        recipient: SELF,
      },
    })
    (map-set ApprovedContracts (contract-of ft) true)
    (contract-call? ft transfer amount contract-caller SELF none)
  )
)

;; only the owner can withdraw STX from this contract
(define-public (withdraw-stx (amount uint))
  (begin
    (asserts! (is-owner) ERR_CALLER_NOT_OWNER)
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
    (asserts! (is-owner) ERR_CALLER_NOT_OWNER)
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

;; DAO Interaction Functions

;; the owner or the agent (if enabled) can create proposals if the proposal voting contract is approved
(define-public (create-action-proposal
    (votingContract <action-proposal-voting-trait>)
    (action <action-trait>)
    (parameters (buff 2048))
    (memo (optional (string-ascii 1024)))
  )
  (begin
    (asserts! (use-proposals-allowed) ERR_OPERATION_NOT_ALLOWED)
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
    (asserts! (use-proposals-allowed) ERR_OPERATION_NOT_ALLOWED)
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
    (asserts! (use-proposals-allowed) ERR_OPERATION_NOT_ALLOWED)
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
    (asserts! (use-proposals-allowed) ERR_OPERATION_NOT_ALLOWED)
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

;; Generalized trading functions, requires adapter for specific routes

;; the owner or the agent (if enabled) can buy DAO tokens
(define-public (buy-dao-token
    (swapAdapter <dao-swap-adapter>)
    (daoToken <ft-trait>)
    (amount uint)
    (minReceive (optional uint))
  )
  (begin
    (asserts! (buy-sell-assets-allowed) ERR_OPERATION_NOT_ALLOWED)
    (asserts!
      (and
        (is-approved-contract (contract-of swapAdapter))
        (is-approved-contract (contract-of daoToken))
      )
      ERR_CONTRACT_NOT_APPROVED
    )
    (print {
      notification: "aibtc-agent-account/buy-dao-token",
      payload: {
        swapAdapter: (contract-of swapAdapter),
        daoToken: (contract-of daoToken),
        amount: amount,
        minReceive: minReceive,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (as-contract (contract-call? swapAdapter buy-dao-token daoToken amount minReceive))
  )
)

;; the owner or the agent (if enabled) can sell DAO tokens
(define-public (sell-dao-token
    (swapAdapter <dao-swap-adapter>)
    (daoToken <ft-trait>)
    (amount uint)
    (minReceive (optional uint))
  )
  (begin
    (asserts! (buy-sell-assets-allowed) ERR_OPERATION_NOT_ALLOWED)
    (asserts!
      (and
        (is-approved-contract (contract-of swapAdapter))
        (is-approved-contract (contract-of daoToken))
      )
      ERR_CONTRACT_NOT_APPROVED
    )
    (print {
      notification: "aibtc-agent-account/sell-dao-token",
      payload: {
        swapAdapter: (contract-of swapAdapter),
        daoToken: (contract-of daoToken),
        amount: amount,
        minReceive: minReceive,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (as-contract (contract-call? swapAdapter sell-dao-token daoToken amount minReceive))
  )
)

;; Agent Account Configuration Functions

;; the owner can set whether the agent can deposit assets
(define-public (set-agent-can-deposit-assets (canDeposit bool))
  (begin
    (asserts! (is-owner) ERR_CALLER_NOT_OWNER)
    (print {
      notification: "aibtc-agent-account/set-agent-can-deposit-assets",
      payload: {
        canDeposit: canDeposit,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (ok (var-set agentCanDepositAssets canDeposit))
  )
)

;; the owner can set whether the agent can use proposals
(define-public (set-agent-can-use-proposals (canUseProposals bool))
  (begin
    (asserts! (is-owner) ERR_CALLER_NOT_OWNER)
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
    (asserts! (is-owner) ERR_CALLER_NOT_OWNER)
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
(define-public (set-agent-can-buy-sell-assets (canBuySell bool))
  (begin
    (asserts! (is-owner) ERR_CALLER_NOT_OWNER)
    (print {
      notification: "aibtc-agent-account/set-agent-can-buy-sell-assets",
      payload: {
        canBuySell: canBuySell,
        sender: tx-sender,
        caller: contract-caller,
      },
    })
    (ok (var-set agentCanBuySellAssets canBuySell))
  )
)

;; the owner or the agent (if enabled) can approve a contract for use with the agent account
(define-public (approve-contract (contract principal))
  (begin
    (asserts! (approve-revoke-contract-allowed) ERR_OPERATION_NOT_ALLOWED)
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
    (asserts! (approve-revoke-contract-allowed) ERR_OPERATION_NOT_ALLOWED)
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

;; read only functions

(define-read-only (is-approved-contract (contract principal))
  (default-to false (map-get? ApprovedContracts contract))
)

(define-read-only (get-configuration)
  {
    account: SELF,
    agent: ACCOUNT_AGENT,
    owner: ACCOUNT_OWNER,
    sbtc: SBTC_TOKEN,
  }
)

(define-read-only (get-agent-permissions)
  {
    canDeposit: (var-get agentCanDepositAssets),
    canUseProposals: (var-get agentCanUseProposals),
    canApproveRevokeContracts: (var-get agentCanApproveRevokeContracts),
    canBuySell: (var-get agentCanBuySellAssets),
  }
)

;; private functions

(define-private (is-owner)
  (is-eq contract-caller ACCOUNT_OWNER)
)

(define-private (is-agent)
  (is-eq contract-caller ACCOUNT_AGENT)
)

(define-private (deposit-allowed)
  (or (is-owner) (and (is-agent) (var-get agentCanDepositAssets)))
)

(define-private (use-proposals-allowed)
  (or (is-owner) (and (is-agent) (var-get agentCanUseProposals)))
)

(define-private (approve-revoke-contract-allowed)
  (or (is-owner) (and (is-agent) (var-get agentCanApproveRevokeContracts)))
)

(define-private (buy-sell-assets-allowed)
  (or (is-owner) (and (is-agent) (var-get agentCanBuySellAssets)))
)

(begin
  ;; print creation event
  (print {
    notification: "aibtc-agent-account/user-agent-account-created",
    payload: {
      config: (get-configuration),
      agentPermissions: (get-agent-permissions),
    },
  })
)
