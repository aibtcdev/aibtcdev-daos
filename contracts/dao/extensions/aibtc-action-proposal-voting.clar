;; title: aibtc-action-proposal-voting
;; version: 3.0.0
;; summary: An extension that manages voting on predefined actions using a SIP-010 Stacks token.

;; traits
;;

;; /g/.aibtc-dao-traits.extension/dao_trait_extension
(impl-trait .aibtc-dao-traits.extension)
;; /g/.aibtc-dao-traits.action-proposal-voting/dao_trait_action_proposal_voting
(impl-trait .aibtc-dao-traits.action-proposal-voting)
;; /g/.aibtc-dao-traits.action/dao_trait_action
(use-trait action-trait .aibtc-dao-traits.action)

;; constants
;;

(define-constant SELF (as-contract tx-sender))
(define-constant DEPLOYED_BITCOIN_BLOCK burn-block-height)
(define-constant DEPLOYED_STACKS_BLOCK stacks-block-height)

;; error messages
(define-constant ERR_NOT_DAO_OR_EXTENSION (err u1300))
(define-constant ERR_FETCHING_TOKEN_DATA (err u1301))
(define-constant ERR_INSUFFICIENT_BALANCE (err u1302))
(define-constant ERR_PROPOSAL_NOT_FOUND (err u1303))
(define-constant ERR_PROPOSAL_VOTING_ACTIVE (err u1304))
(define-constant ERR_PROPOSAL_EXECUTION_DELAY (err u1305))
(define-constant ERR_PROPOSAL_RATE_LIMIT (err u1306))
(define-constant ERR_SAVING_PROPOSAL (err u1307))
(define-constant ERR_PROPOSAL_ALREADY_CONCLUDED (err u1308))
(define-constant ERR_RETRIEVING_START_BLOCK_HASH (err u1309))
(define-constant ERR_VOTE_TOO_SOON (err u1310))
(define-constant ERR_VOTE_TOO_LATE (err u1311))
(define-constant ERR_ALREADY_VOTED (err u1312))
(define-constant ERR_INVALID_ACTION (err u1313))

;; proposal status flags
(define-constant STATUS_CONCLUDED (pow u2 u0))
(define-constant STATUS_MET_QUORUM (pow u2 u1))
(define-constant STATUS_MET_THRESHOLD (pow u2 u2))
(define-constant STATUS_PASSED (pow u2 u3))
(define-constant STATUS_EXECUTED (pow u2 u4))
(define-constant STATUS_EXPIRED (pow u2 u5))
(define-constant STATUS_VETO_MET_QUORUM (pow u2 u6))
(define-constant STATUS_VETO_EXCEEDS_YES (pow u2 u7))
(define-constant STATUS_VETOED (pow u2 u8))

(define-constant AIBTC_DAO_RUN_COST_AMOUNT u20000000000) ;; 200 DAO tokens w/ 8 decimals

;; /g/.aibtc-dao-run-cost/base_contract_dao_run_cost
(define-constant AIBTC_DAO_RUN_COST_CONTRACT .aibtc-dao-run-cost) ;; AIBTC dao run cost contract
;; /g/.aibtc-rewards-account/dao_contract_rewards_account
(define-constant DAO_REWARDS_ACCOUNT .aibtc-rewards-account) ;; rewards account for the DAO

;; voting configuration
(define-constant VOTING_QUORUM u15) ;; 15% of liquid supply must participate
(define-constant VOTING_THRESHOLD u66) ;; 66% of votes must be in favor
(define-constant VOTING_BOND u25000000000) ;; action proposal bond, 250 DAO tokens w/ 8 decimals
(define-constant VOTING_REWARD u100000000000) ;; action proposal reward, 1,000 DAO tokens w/ 8 decimals
;; /g/.aibtc-treasury/dao_contract_treasury
(define-constant VOTING_TREASURY .aibtc-treasury) ;; used to calculate liquid supply

;; set voting delay
;; mainnet: 12 blocks (2 hours)
;; testnet: 3 blocks (30 minutes)
(define-constant VOTING_DELAY u12)
;; set voting period
;; mainnet: 24 blocks (4 hours)
;; testnet: 3 blocks (30 minutes)
(define-constant VOTING_PERIOD u24)

(define-constant REPUTATION_CHANGE u1) ;; reputation increase/decrease

;; data vars
;;

(define-data-var proposalCount uint u0) ;; total number of proposals
(define-data-var concludedProposalCount uint u0) ;; total number of concluded proposals
(define-data-var executedProposalCount uint u0) ;; total number of executed proposals

(define-data-var lastProposalStacksBlock uint DEPLOYED_STACKS_BLOCK) ;; stacks block height of last proposal created
(define-data-var lastProposalBitcoinBlock uint DEPLOYED_BITCOIN_BLOCK) ;; bitcoin block height of last proposal created

;; data maps
;;

(define-map Proposals
  uint ;; proposal ID
  {
    ;; from ProposalDetails
    action: principal,
    parameters: (buff 2048),
    bond: uint,
    caller: principal,
    creator: principal,
    creatorUserId: uint,
    liquidTokens: uint,
    memo: (optional (string-ascii 1024)),
    ;; from ProposalBlocks
    createdBtc: uint,
    createdStx: uint,
    voteStart: uint,
    voteEnd: uint,
    execStart: uint,
    execEnd: uint,
    ;; from ProposalRecords
    votesFor: uint,
    votesAgainst: uint,
    vetoVotes: uint,
    status: uint,
  }
)

(define-map VoteRecords
  {
    proposalId: uint, ;; proposal id
    voter: principal, ;; voter address
  }
  {
    vote: bool, ;; true for yes, false for no
    amount: uint, ;; total votes
  }
)

(define-map VetoVoteRecords
  {
    proposalId: uint, ;; proposal id
    voter: principal, ;; voter address
  }
  uint ;; total veto votes
)

;; public functions
;;

(define-public (callback
    (sender principal)
    (memo (buff 34))
  )
  (ok true)
)

(define-public (create-action-proposal
    (action <action-trait>)
    (parameters (buff 2048))
    (memo (optional (string-ascii 1024)))
  )
  (let (
      (actionContract (contract-of action))
      ;; /g/.aibtc-dao-users/dao_contract_users
      (userId (try! (contract-call? .aibtc-dao-users get-or-create-user-index contract-caller)))
      (newId (+ (var-get proposalCount) u1))
      (createdStx (- stacks-block-height u1))
      (createdBtc burn-block-height)
      (liquidTokens (try! (get-liquid-supply createdStx)))
      (voteStart (+ createdBtc VOTING_DELAY))
      (voteEnd (+ voteStart VOTING_PERIOD))
      (execStart (+ voteEnd VOTING_DELAY))
      (execEnd (+ execStart VOTING_PERIOD))
      (validAction (is-action-valid action))
    )
    ;; liquidTokens is greater than zero
    (asserts! (> liquidTokens u0) ERR_FETCHING_TOKEN_DATA)
    ;; verify this extension and action contract are active in dao
    (asserts! validAction ERR_INVALID_ACTION)
    ;; verify the parameters are valid
    (try! (contract-call? action check-parameters parameters))
    ;; at least one btc block has passed since last proposal
    (asserts! (> createdBtc (var-get lastProposalBitcoinBlock))
      ERR_PROPOSAL_RATE_LIMIT
    )
    ;; print proposal creation event
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-action-proposal-voting/create-action-proposal",
      payload: {
        contractCaller: contract-caller,
        txSender: tx-sender,
        action: actionContract,
        parameters: parameters,
        bond: VOTING_BOND,
        caller: contract-caller,
        creator: contract-caller,
        creatorUserId: userId,
        liquidTokens: liquidTokens,
        memo: memo,
        createdBtc: createdBtc,
        createdStx: createdStx,
        voteStart: voteStart,
        voteEnd: voteEnd,
        execStart: execStart,
        execEnd: execEnd,
        proposalId: newId,
        votingPeriod: VOTING_PERIOD,
        votingQuorum: VOTING_QUORUM,
        votingThreshold: VOTING_THRESHOLD,
        votingDelay: VOTING_DELAY,
        votingReward: VOTING_REWARD,
      },
    })
    ;; create the proposal
    (asserts!
      (map-insert Proposals newId {
        ;; from ProposalDetails
        action: actionContract,
        parameters: parameters,
        bond: VOTING_BOND,
        caller: contract-caller,
        creator: contract-caller,
        creatorUserId: userId,
        liquidTokens: liquidTokens,
        memo: memo,
        ;; from ProposalBlocks
        createdBtc: createdBtc,
        createdStx: createdStx,
        voteStart: voteStart,
        voteEnd: voteEnd,
        execStart: execStart,
        execEnd: execEnd,
        ;; from ProposalRecords
        votesFor: u0,
        votesAgainst: u0,
        vetoVotes: u0,
        status: u0,
      })
      ERR_SAVING_PROPOSAL
    )
    ;; set last proposal created block height
    (var-set lastProposalBitcoinBlock createdBtc)
    (var-set lastProposalStacksBlock createdStx)
    ;; increment proposal count
    (var-set proposalCount newId)
    ;; transfer the proposal bond to this contract
    ;; /g/.aibtc-faktory/dao_contract_token
    (try! (contract-call? .aibtc-faktory transfer VOTING_BOND contract-caller SELF none))
    ;; transfer the run cost fee to the run AIBTC dao cost contract
    ;; /g/.aibtc-treasury/dao_contract_treasury
    ;; /g/.aibtc-faktory/dao_contract_token
    (try! (as-contract (contract-call? .aibtc-treasury withdraw-ft .aibtc-faktory
      AIBTC_DAO_RUN_COST_AMOUNT AIBTC_DAO_RUN_COST_CONTRACT
    )))
    ;; transfer reward to the dao rewards account
    ;; /g/.aibtc-treasury/dao_contract_treasury
    ;; /g/.aibtc-faktory/dao_contract_token
    (as-contract (contract-call? .aibtc-treasury withdraw-ft .aibtc-faktory VOTING_REWARD
      DAO_REWARDS_ACCOUNT
    ))
  )
)

(define-public (vote-on-action-proposal
    (proposalId uint)
    (vote bool)
  )
  (let (
      (proposal (unwrap! (map-get? Proposals proposalId) ERR_PROPOSAL_NOT_FOUND))
      (proposalBlock (get createdStx proposal))
      (proposalBlockHash (unwrap! (get-block-hash proposalBlock) ERR_RETRIEVING_START_BLOCK_HASH))
      (voteAmount (unwrap!
        (at-block proposalBlockHash
          ;; /g/.aibtc-faktory/dao_contract_token
          (contract-call? .aibtc-faktory get-balance contract-caller)
        )
        ERR_FETCHING_TOKEN_DATA
      ))
      ;; /g/.aibtc-dao-users/dao_contract_users
      (userId (try! (contract-call? .aibtc-dao-users get-or-create-user-index contract-caller)))
      (voterRecord (map-get? VoteRecords {
        proposalId: proposalId,
        voter: contract-caller,
      }))
      (previousVote (if (is-some voterRecord)
        (some (get vote (unwrap-panic voterRecord)))
        none
      ))
      (previousVoteAmount (if (is-some voterRecord)
        (some (get amount (unwrap-panic voterRecord)))
        none
      ))
    )
    ;; caller has the required balance
    (asserts! (> voteAmount u0) ERR_INSUFFICIENT_BALANCE)
    ;; proposal was not already concluded
    (asserts! (is-eq u0 (bit-and (get status proposal) STATUS_CONCLUDED))
      ERR_PROPOSAL_ALREADY_CONCLUDED
    )
    ;; proposal vote is still active
    (asserts! (>= burn-block-height (get voteStart proposal)) ERR_VOTE_TOO_SOON)
    (asserts! (< burn-block-height (get voteEnd proposal)) ERR_VOTE_TOO_LATE)
    ;; proposal vote not already cast
    (and
      (is-some voterRecord)
      (asserts! (not (is-eq (get vote (unwrap-panic voterRecord)) vote))
        ERR_ALREADY_VOTED
      )
    )
    ;; print vote event
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-action-proposal-voting/vote-on-action-proposal",
      payload: {
        contractCaller: contract-caller,
        txSender: tx-sender,
        voter: contract-caller,
        voterUserId: userId,
        proposalId: proposalId,
        amount: voteAmount,
        vote: vote,
      },
    })
    (and
      (is-some previousVote)
      ;; update the proposal record to remove the previous vote
      (map-set Proposals proposalId
        (if (is-eq (unwrap-panic previousVote) true)
          (merge proposal { votesFor: (- (get votesFor proposal) (unwrap-panic previousVoteAmount)) })
          (merge proposal { votesAgainst: (- (get votesAgainst proposal) (unwrap-panic previousVoteAmount)) })
        ))
    )
    ;; update the proposal record
    (map-set Proposals proposalId
      (if vote
        (merge proposal { votesFor: (+ (get votesFor proposal) voteAmount) })
        (merge proposal { votesAgainst: (+ (get votesAgainst proposal) voteAmount) })
      ))
    ;; record the vote for the sender
    (ok (map-set VoteRecords {
      proposalId: proposalId,
      voter: contract-caller,
    } {
      vote: vote,
      amount: voteAmount,
    }))
  )
)

(define-public (veto-action-proposal (proposalId uint))
  (let (
      (proposal (unwrap! (map-get? Proposals proposalId) ERR_PROPOSAL_NOT_FOUND))
      (proposalBlock (get createdStx proposal))
      (proposalBlockHash (unwrap! (get-block-hash proposalBlock) ERR_RETRIEVING_START_BLOCK_HASH))
      (vetoAmount (unwrap!
        (at-block proposalBlockHash
          ;; /g/.aibtc-faktory/dao_contract_token
          (contract-call? .aibtc-faktory get-balance contract-caller)
        )
        ERR_FETCHING_TOKEN_DATA
      ))
      ;; /g/.aibtc-dao-users/dao_contract_users
      (userId (try! (contract-call? .aibtc-dao-users get-or-create-user-index contract-caller)))
    )
    ;; caller has the required balance
    (asserts! (> vetoAmount u0) ERR_INSUFFICIENT_BALANCE)
    ;; proposal was not already concluded
    (asserts! (is-eq u0 (bit-and (get status proposal) STATUS_CONCLUDED))
      ERR_PROPOSAL_ALREADY_CONCLUDED
    )
    ;; proposal vote ended, in execution delay
    (asserts! (>= burn-block-height (get voteEnd proposal)) ERR_VOTE_TOO_SOON)
    (asserts! (< burn-block-height (get execStart proposal)) ERR_VOTE_TOO_LATE)
    ;; veto not already cast
    (asserts!
      (is-none (map-get? VetoVoteRecords {
        proposalId: proposalId,
        voter: contract-caller,
      }))
      ERR_ALREADY_VOTED
    )
    ;; print veto event
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-action-proposal-voting/veto-action-proposal",
      payload: {
        contractCaller: contract-caller,
        txSender: tx-sender,
        vetoer: contract-caller,
        vetoerUserId: userId,
        proposalId: proposalId,
        amount: vetoAmount,
      },
    })
    ;; update the proposal record
    (map-set Proposals proposalId
      (merge proposal { vetoVotes: (+ (get vetoVotes proposal) vetoAmount) })
    )
    ;; update the veto vote record for the sender
    (ok (map-set VetoVoteRecords {
      proposalId: proposalId,
      voter: contract-caller,
    }
      vetoAmount
    ))
  )
)

(define-public (conclude-action-proposal
    (proposalId uint)
    (action <action-trait>)
  )
  (let (
      (actionContract (contract-of action))
      (proposal (unwrap! (map-get? Proposals proposalId) ERR_PROPOSAL_NOT_FOUND))
      (creator (get creator proposal))
      (liquidTokens (get liquidTokens proposal))
      (votesFor (get votesFor proposal))
      (votesAgainst (get votesAgainst proposal))
      (vetoVotes (get vetoVotes proposal))
      (hasVotes (> (+ votesFor votesAgainst) u0))
      (metQuorum (and
        hasVotes
        (>= (/ (* (+ votesFor votesAgainst) u100) liquidTokens) VOTING_QUORUM)
      ))
      (metThreshold (and
        hasVotes
        (>= (/ (* votesFor u100) (+ votesFor votesAgainst)) VOTING_THRESHOLD)
      ))
      (vetoMetQuorum (and
        (> vetoVotes u0)
        (>= (/ (* vetoVotes u100) liquidTokens) VOTING_QUORUM)
      ))
      (vetoExceedsYes (> vetoVotes votesFor))
      (vetoActivated (and vetoMetQuorum vetoExceedsYes))
      ;; evaluate criteria to determine if proposal passed
      (votePassed (and
        hasVotes ;; check if there are any votes
        metQuorum ;; quorum: total votes vs liquid supply
        metThreshold ;; threshold: enough yes votes vs total votes
        (not vetoActivated) ;; veto: reached quorum and more than yes votes
      ))
      ;; check info for running action
      (validAction (and votePassed (is-action-valid action)))
      (burnBlock burn-block-height)
      (notExpired (< burnBlock (get execEnd proposal)))
      (tryToExecute (and
        votePassed
        validAction
        notExpired
      ))
      (newStatus (+ STATUS_CONCLUDED
        (if metQuorum
          STATUS_MET_QUORUM
          u0
        )
        (if metThreshold
          STATUS_MET_THRESHOLD
          u0
        )
        (if votePassed
          STATUS_PASSED
          u0
        )
        (if tryToExecute
          STATUS_EXECUTED
          u0
        )
        (if (not notExpired)
          STATUS_EXPIRED
          u0
        )
        (if vetoMetQuorum
          STATUS_VETO_MET_QUORUM
          u0
        )
        (if vetoExceedsYes
          STATUS_VETO_EXCEEDS_YES
          u0
        )
        (if vetoActivated
          STATUS_VETOED
          u0
        )))
    )
    ;; proposal not already concluded
    (asserts! (is-eq u0 (bit-and (get status proposal) STATUS_CONCLUDED))
      ERR_PROPOSAL_ALREADY_CONCLUDED
    )
    ;; proposal is past voting period
    (asserts! (>= burnBlock (get voteEnd proposal)) ERR_PROPOSAL_VOTING_ACTIVE)
    ;; proposal is past execution delay
    (asserts! (>= burnBlock (get execStart proposal))
      ERR_PROPOSAL_EXECUTION_DELAY
    )
    ;; action must be the same as the one in proposal
    (asserts! (is-eq (get action proposal) actionContract) ERR_INVALID_ACTION)
    ;; record user in dao if not already
    ;; /g/.aibtc-dao-users/dao_contract_users
    (try! (contract-call? .aibtc-dao-users get-or-create-user-index contract-caller))
    ;; print conclusion event
    (print {
      ;; /g/aibtc/dao_token_symbol
      notification: "aibtc-action-proposal-voting/conclude-action-proposal",
      payload: {
        contractCaller: contract-caller,
        txSender: tx-sender,
        action: actionContract,
        parameters: (get parameters proposal),
        bond: (get bond proposal),
        creator: creator,
        creatorUserId: (get creatorUserId proposal),
        liquidTokens: liquidTokens,
        memo: (get memo proposal),
        proposalId: proposalId,
        votesFor: votesFor,
        votesAgainst: votesAgainst,
        vetoVotes: vetoVotes,
        metQuorum: metQuorum,
        metThreshold: metThreshold,
        vetoMetQuorum: vetoMetQuorum,
        vetoExceedsYes: vetoExceedsYes,
        vetoed: vetoActivated,
        passed: votePassed,
        expired: (not notExpired),
        executed: tryToExecute,
        status: newStatus,
      },
    })
    ;; update the proposal record
    (map-set Proposals proposalId (merge proposal { status: newStatus }))
    ;; transfer the bond based on the outcome
    (if votePassed
      ;; /g/.aibtc-faktory/dao_contract_token
      (try! (as-contract (contract-call? .aibtc-faktory transfer (get bond proposal) SELF creator
        none
      )))
      ;; /g/.aibtc-faktory/dao_contract_token
      (try! (as-contract (contract-call? .aibtc-faktory transfer (get bond proposal) SELF
        VOTING_TREASURY none
      )))
    )
    ;; update the users reputation based on outcome
    (if votePassed
      ;; /g/.aibtc-dao-users/dao_contract_users
      (try! (contract-call? .aibtc-dao-users increase-user-reputation creator
        REPUTATION_CHANGE
      ))
      ;; /g/.aibtc-dao-users/dao_contract_users
      (try! (contract-call? .aibtc-dao-users decrease-user-reputation creator
        REPUTATION_CHANGE
      ))
    )
    ;; increment the concluded proposal count
    (var-set concludedProposalCount (+ (var-get concludedProposalCount) u1))
    ;; try to execute the action if the proposal passed
    (ok (if tryToExecute
      (and
        ;; increment the executed proposal count
        (var-set executedProposalCount (+ (var-get executedProposalCount) u1))
        ;; try to run the action
        (match (contract-call? action run (get parameters proposal))
          ;; running the action succeeded
          ok_
          ;; /g/.aibtc-rewards-account/dao_contract_rewards_account
          (try! (as-contract (contract-call? .aibtc-rewards-account transfer-reward creator
            VOTING_REWARD
          )))
          ;; return false and print error on failure
          err_
          (begin
            (print {
              ;; /g/aibtc/dao_token_symbol
              notification: "aibtc-action-proposal-voting/conclude-action-proposal",
              payload: { executionError: err_ },
            })
            ;; /g/.aibtc-rewards-account/dao_contract_rewards_account
            (try! (as-contract (contract-call? .aibtc-rewards-account transfer-reward
              VOTING_TREASURY VOTING_REWARD
            )))
            false
          )
        )
      )
      false
    ))
  )
)

;; read only functions
;;

(define-read-only (get-voting-power
    (proposalId uint)
    (voter principal)
  )
  (let (
      (proposal (unwrap! (map-get? Proposals proposalId) ERR_PROPOSAL_NOT_FOUND))
      (proposalBlockHash (unwrap! (get-block-hash (get createdStx proposal))
        ERR_RETRIEVING_START_BLOCK_HASH
      ))
    )
    ;; /g/.aibtc-faktory/dao_contract_token
    (at-block proposalBlockHash (contract-call? .aibtc-faktory get-balance voter))
  )
)

(define-read-only (get-proposal (proposalId uint))
  (match (map-get? Proposals proposalId)
    proposal (some (merge proposal {
      concluded: (not (is-eq u0 (bit-and (get status proposal) STATUS_CONCLUDED))),
      metQuorum: (not (is-eq u0 (bit-and (get status proposal) STATUS_MET_QUORUM))),
      metThreshold: (not (is-eq u0 (bit-and (get status proposal) STATUS_MET_THRESHOLD))),
      passed: (not (is-eq u0 (bit-and (get status proposal) STATUS_PASSED))),
      executed: (not (is-eq u0 (bit-and (get status proposal) STATUS_EXECUTED))),
      expired: (not (is-eq u0 (bit-and (get status proposal) STATUS_EXPIRED))),
      vetoMetQuorum: (not (is-eq u0 (bit-and (get status proposal) STATUS_VETO_MET_QUORUM))),
      vetoExceedsYes: (not (is-eq u0 (bit-and (get status proposal) STATUS_VETO_EXCEEDS_YES))),
      vetoed: (not (is-eq u0 (bit-and (get status proposal) STATUS_VETOED))),
    }))
    none
  )
)

(define-read-only (get-vote-record
    (proposalId uint)
    (voter principal)
  )
  (map-get? VoteRecords {
    proposalId: proposalId,
    voter: voter,
  })
)

(define-read-only (get-veto-vote-record
    (proposalId uint)
    (voter principal)
  )
  (map-get? VetoVoteRecords {
    proposalId: proposalId,
    voter: voter,
  })
)

(define-read-only (get-vote-records
    (proposalId uint)
    (voter principal)
  )
  {
    voteRecord: (get-vote-record proposalId voter),
    vetoVoteRecord: (get-veto-vote-record proposalId voter),
  }
)

(define-read-only (get-total-proposals)
  {
    proposalCount: (var-get proposalCount),
    concludedProposalCount: (var-get concludedProposalCount),
    executedProposalCount: (var-get executedProposalCount),
    lastProposalStacksBlock: (var-get lastProposalStacksBlock),
    lastProposalBitcoinBlock: (var-get lastProposalBitcoinBlock),
  }
)

(define-read-only (get-voting-configuration)
  {
    self: SELF,
    deployedBitcoinBlock: DEPLOYED_BITCOIN_BLOCK,
    deployedStacksBlock: DEPLOYED_STACKS_BLOCK,
    delay: VOTING_DELAY,
    period: VOTING_PERIOD,
    quorum: VOTING_QUORUM,
    threshold: VOTING_THRESHOLD,
    treasury: VOTING_TREASURY,
    proposalBond: VOTING_BOND,
    proposalReward: VOTING_REWARD,
  }
)

;; calculate the liquid supply of the dao token at a past stacks block height
(define-read-only (get-liquid-supply (blockHeight uint))
  (let (
      (blockHash (unwrap! (get-block-hash blockHeight) ERR_RETRIEVING_START_BLOCK_HASH))
      (totalSupply (unwrap!
        ;; /g/.aibtc-faktory/dao_contract_token
        (at-block blockHash (contract-call? .aibtc-faktory get-total-supply))
        ERR_FETCHING_TOKEN_DATA
      ))
      (treasuryBalance (unwrap!
        (at-block blockHash
          ;; /g/.aibtc-faktory/dao_contract_token
          (contract-call? .aibtc-faktory get-balance VOTING_TREASURY)
        )
        ERR_FETCHING_TOKEN_DATA
      ))
    )
    (ok (- totalSupply treasuryBalance))
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

(define-private (is-action-valid (action <action-trait>))
  (let (
      (extensionActive (is-ok (as-contract (is-dao-or-extension))))
      ;; /g/.aibtc-base-dao/dao_contract_base
      (actionActive (contract-call? .aibtc-base-dao is-extension (contract-of action)))
    )
    (and extensionActive actionActive)
  )
)

(define-private (get-block-hash (blockHeight uint))
  (get-stacks-block-info? id-header-hash blockHeight)
)
