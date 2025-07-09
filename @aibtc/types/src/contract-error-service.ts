import {
  ContractType,
  ContractSubtype,
  CONTRACT_NAMES,
} from "../../../utilities/contract-types";
import * as ClarityErrors from "./clarity-contract-errors";

export interface EnrichedErrorCodeDetail {
  contractType: ContractType;
  contractSubtype: ContractSubtype<ContractType>;
  contractName: string; // Official contract name, e.g., "aibtc-agent-account"
  code: number; // Numeric error code, e.g., 1100
  name: string; // Enum key, e.g., ERR_UNAUTHORIZED
  description: string; // Human-readable description
}

// Internal structure for defining errors, similar to contract-types.ts
interface ContractSpecificErrorDefinition {
  enumObject: Record<string, string | number>; // The error enum itself
  descriptions: Record<string, string>; // Map of enum key (string) to its description
}

const errorDefinitions: {
  [T in ContractType]?: {
    [S in ContractSubtype<T>]?: ContractSpecificErrorDefinition;
  };
} = {
  CORE: {
    DAO_RUN_COST: {
      enumObject: ClarityErrors.ErrCodeDaoRunCost,
      descriptions: {
        ERR_NOT_OWNER: "Caller is not an authorized owner.",
        ERR_ASSET_NOT_ALLOWED:
          "The specified asset is not allowed for this operation.",
        ERR_PROPOSAL_MISMATCH:
          "The provided proposal parameters do not match the existing proposal.",
        ERR_SAVING_PROPOSAL: "Failed to save the proposal details.",
      },
    },
  },
  AGENT: {
    AGENT_ACCOUNT: {
      enumObject: ClarityErrors.ErrCodeAgentAccount,
      descriptions: {
        ERR_CALLER_NOT_OWNER:
          "The caller is not the owner of the agent account.",
        ERR_CONTRACT_NOT_APPROVED:
          "The specified contract is not approved for interaction.",
        ERR_OPERATION_NOT_ALLOWED:
          "The requested operation is not allowed for the caller.",
      },
    },
  },
  BASE: {
    DAO: {
      enumObject: ClarityErrors.ErrCodeBaseDao,
      descriptions: {
        ERR_UNAUTHORIZED: "Sender is not authorized to perform this action.",
        ERR_ALREADY_EXECUTED: "The proposal has already been executed.",
        ERR_INVALID_EXTENSION:
          "The specified extension is not valid or recognized.",
        ERR_NO_EMPTY_LISTS: "Input lists cannot be empty.",
        ERR_DAO_ALREADY_CONSTRUCTED:
          "The DAO has already been constructed/initialized.",
      },
    },
  },
  EXTENSIONS: {
    ACTION_PROPOSAL_VOTING: {
      enumObject: ClarityErrors.ErrCodeActionProposalVoting,
      descriptions: {
        ERR_NOT_DAO_OR_EXTENSION:
          "Caller is not the DAO or an authorized extension.",
        ERR_FETCHING_TOKEN_DATA: "Failed to fetch on-chain token data.",
        ERR_INSUFFICIENT_BALANCE:
          "Insufficient DAO token balance to create the proposal.",
        ERR_PROPOSAL_NOT_FOUND: "The specified proposal ID was not found.",
        ERR_PROPOSAL_VOTING_ACTIVE: "Voting on the proposal is still active.",
        ERR_PROPOSAL_EXECUTION_DELAY:
          "Proposal execution delay has not passed.",
        ERR_PROPOSAL_RATE_LIMIT:
          "Proposal creation rate limit exceeded (only 1 per Bitcoin block).",
        ERR_SAVING_PROPOSAL: "Failed to save the proposal details.",
        ERR_PROPOSAL_ALREADY_CONCLUDED:
          "The proposal has already been concluded.",
        ERR_RETRIEVING_START_BLOCK_HASH:
          "Failed to retrieve start block hash for voting.",
        ERR_VOTE_TOO_SOON:
          "Vote cast before voting period started, or veto cast before veto period started.",
        ERR_VOTE_TOO_LATE:
          "Vote cast after voting period ended, or veto cast after veto period ended.",
        ERR_ALREADY_VOTED:
          "The voter has already cast a veto vote on this proposal.",
        ERR_INVALID_ACTION:
          "This contract or the proposed action contract is not an extension in the DAO.",
      },
    },
    DAO_CHARTER: {
      enumObject: ClarityErrors.ErrCodeDaoCharter,
      descriptions: {
        ERR_NOT_DAO_OR_EXTENSION:
          "Caller is not the DAO or an authorized extension.",
        ERR_SAVING_CHARTER: "Failed to save the DAO charter.",
        ERR_CHARTER_TOO_SHORT: "The provided charter is too short.",
        ERR_CHARTER_TOO_LONG: "The provided charter is too long.",
      },
    },
    DAO_USERS: {
      enumObject: ClarityErrors.ErrCodeDaoUsers,
      descriptions: {
        ERR_NOT_DAO_OR_EXTENSION:
          "Caller is not the DAO or an authorized extension.",
        ERR_USER_NOT_FOUND: "The specified user was not found.",
      },
    },
    ONCHAIN_MESSAGING: {
      enumObject: ClarityErrors.ErrCodeOnchainMessaging,
      descriptions: {
        ERR_NOT_DAO_OR_EXTENSION:
          "Caller is not the DAO or an authorized extension.",
        ERR_INVALID_INPUT: "The input provided for messaging is invalid.",
        ERR_FETCHING_TOKEN_DATA:
          "Failed to fetch token data for messaging conditions.",
      },
    },
    REWARDS_ACCOUNT: {
      enumObject: ClarityErrors.ErrCodeRewardsAccount,
      descriptions: {
        ERR_NOT_DAO_OR_EXTENSION:
          "Caller is not the DAO or an authorized extension.",
        ERR_INSUFFICIENT_BALANCE:
          "Insufficient balance in the rewards account.",
      },
    },
    TOKEN_OWNER: {
      enumObject: ClarityErrors.ErrCodeTokenOwner,
      descriptions: {
        ERR_NOT_DAO_OR_EXTENSION:
          "Caller is not the DAO or an authorized extension.",
      },
    },
    TREASURY: {
      enumObject: ClarityErrors.ErrCodeTreasury,
      descriptions: {
        ERR_NOT_DAO_OR_EXTENSION:
          "Caller is not the DAO or an authorized extension.",
        ERR_ASSET_NOT_ALLOWED:
          "The specified asset is not allowed in the treasury.",
      },
    },
  },
  ACTIONS: {
    SEND_MESSAGE: {
      enumObject: ClarityErrors.ErrCodeActionSendMessage,
      descriptions: {
        ERR_NOT_DAO_OR_EXTENSION:
          "Caller is not the DAO or an authorized extension.",
        ERR_INVALID_PARAMETERS:
          "Invalid parameters provided for sending a message.",
      },
    },
  },
};

const allErrorDetailsList: EnrichedErrorCodeDetail[] = [];

function initializeErrorService(): void {
  for (const typeKey in errorDefinitions) {
    const contractType = typeKey as ContractType;
    const subtypesOfType = errorDefinitions[contractType];
    if (subtypesOfType) {
      for (const subtypeKey in subtypesOfType) {
        const contractSubtype = subtypeKey as ContractSubtype<
          typeof contractType
        >;
        // The type assertion here is necessary because TypeScript can't infer
        // that subtypeKey is a valid key for subtypesOfType within this generic loop.
        const definition = (subtypesOfType as any)[contractSubtype] as
          | ContractSpecificErrorDefinition
          | undefined;

        if (definition) {
          const officialContractName =
            (CONTRACT_NAMES[contractType] as any)?.[contractSubtype] ||
            `${contractType}-${contractSubtype}-UnknownName`;

          for (const enumMemberName in definition.enumObject) {
            if (isNaN(Number(enumMemberName))) {
              // Filter out reverse numeric mappings from enums
              const numericCode = definition.enumObject[
                enumMemberName
              ] as number;
              allErrorDetailsList.push({
                contractType: contractType,
                contractSubtype: contractSubtype,
                contractName: officialContractName,
                code: numericCode,
                name: enumMemberName,
                description:
                  definition.descriptions[enumMemberName] ||
                  "No description available.",
              });
            }
          }
        }
      }
    }
  }
}

initializeErrorService(); // Populate the list on module load

/**
 * Retrieves all known error details.
 * @returns A shallow copy of the list of all enriched error code details.
 */
export function getAllErrorDetails(): EnrichedErrorCodeDetail[] {
  return [...allErrorDetailsList];
}

/**
 * Retrieves error details for a specific contract type and subtype.
 * @param params Parameters to filter errors by.
 * @param params.type The contract type.
 * @param params.subtype The contract subtype.
 * @returns An array of enriched error code details matching the contract type and subtype.
 */
export function getErrorsByContractDetails(params: {
  type: ContractType;
  subtype: ContractSubtype<ContractType>;
}): EnrichedErrorCodeDetail[] {
  return allErrorDetailsList.filter(
    (detail) =>
      detail.contractType === params.type &&
      detail.contractSubtype === params.subtype
  );
}

/**
 * Finds error details based on various criteria.
 * This is a flexible search function.
 * @param params Parameters to filter errors by.
 * @param params.identifier Optional. Error name (string) or code (number or "u" prefixed string like "u1234").
 * @param params.contractType Optional. The contract type to scope the search.
 * @param params.contractSubtype Optional. The contract subtype to scope the search.
 * @returns An array of enriched error code details matching the criteria.
 */
export function findErrorDetails(params: {
  identifier?: string | number;
  contractType?: ContractType;
  contractSubtype?: ContractSubtype<ContractType>;
}): EnrichedErrorCodeDetail[] {
  let results = [...allErrorDetailsList];

  if (params.contractType) {
    results = results.filter(
      (detail) => detail.contractType === params.contractType
    );
    if (params.contractSubtype) {
      results = results.filter(
        (detail) => detail.contractSubtype === params.contractSubtype
      );
    }
  }

  if (params.identifier !== undefined) {
    let numericCode: number | undefined;
    let searchName: string | undefined;

    if (typeof params.identifier === "number") {
      numericCode = params.identifier;
    } else if (typeof params.identifier === "string") {
      if (params.identifier.toLowerCase().startsWith("u")) {
        const potentialCode = parseInt(params.identifier.substring(1), 10);
        if (!isNaN(potentialCode)) {
          numericCode = potentialCode;
        } else {
          searchName = params.identifier; // Not a 'uXXXX' format, treat as name
        }
      } else {
        // If it's a string that can be parsed as a number, treat it as a code.
        const potentialCode = parseInt(params.identifier, 10);
        if (
          !isNaN(potentialCode) &&
          String(potentialCode) === params.identifier
        ) {
          numericCode = potentialCode;
        } else {
          searchName = params.identifier; // Treat as name
        }
      }
    }

    if (numericCode !== undefined) {
      results = results.filter((detail) => detail.code === numericCode);
    } else if (searchName) {
      results = results.filter((detail) => detail.name === searchName);
    }
  }
  return results;
}

/**
 * Retrieves the description for a specific error.
 * For reliable results when using an error name as an identifier,
 * contractType and contractSubtype should be provided to ensure uniqueness.
 * @param params Parameters to identify the error.
 * @param params.identifier Error name (string) or code (number or "u" prefixed string).
 * @param params.contractType Required when identifier is a name to ensure uniqueness. Recommended for code.
 * @param params.contractSubtype Required when identifier is a name to ensure uniqueness. Recommended for code.
 * @returns The error description if a unique match is found, otherwise undefined.
 */
export function getErrorDescription(params: {
  identifier: string | number;
  contractType: ContractType;
  contractSubtype: ContractSubtype<ContractType>;
}): string | undefined {
  const matchingDetails = findErrorDetails({
    identifier: params.identifier,
    contractType: params.contractType,
    contractSubtype: params.contractSubtype,
  });

  if (matchingDetails.length === 1) {
    return matchingDetails[0].description;
  }
  // If 0 or more than 1 match (ambiguous), return undefined.
  // This enforces that the caller provides enough specificity.
  return undefined;
}
