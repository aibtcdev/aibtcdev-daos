import { Hono } from "hono";
import { StacksNetworkName } from "@stacks/network";
import {
  ContractsListResponse,
  ContractNamesResponse,
  ContractDetailResponse,
  ContractsByTypeResponse,
  ContractDependenciesResponse,
  ContractTypesResponse,
  GeneratedContractResponse,
  GeneratedDaoContractsResponse,
} from "@aibtc/types";
import { CloudflareBindings } from "./cf-types";
import { ContractRegistry } from "../utilities/contract-registry";
import {
  ContractType,
  CONTRACT_TYPES,
  CONTRACT_SUBTYPES,
} from "../utilities/contract-types";
import { ApiError } from "./utils/api-error";
import { ErrorCode } from "./utils/error-catalog";
import { handleRequest } from "./utils/request-handler";
import { ContractGeneratorService } from "./services/contract-generator";

export function createApiRouter(registry: ContractRegistry) {
  const api = new Hono<{ Bindings: CloudflareBindings }>();
  const generatorService = new ContractGeneratorService();

  // Root endpoint
  api.get("/", (c) => {
    return handleRequest(
      c,
      async () => {
        return {
          status: "ok",
          message: "API is running",
        };
      },
      { path: "/", method: "GET" }
    );
  });

  // Get all contract types and their subtypes
  api.get("/types", (c) => {
    return handleRequest(
      c,
      async () => {
        const result: Record<string, string[]> = {};

        CONTRACT_TYPES.forEach((type) => {
          result[type] = CONTRACT_SUBTYPES[type]
            ? Object.values(CONTRACT_SUBTYPES[type])
            : [];
        });
        return { types: result } as ContractTypesResponse;
      },
      { path: "/types", method: "GET" }
    );
  });

  // Get all contracts in the registry
  api.get("/contracts", (c) => {
    return handleRequest(
      c,
      async () => {
        const contracts = registry.getAllContracts();
        const contractData = contracts.map((contract) => ({
          name: contract.name,
          displayName: contract.displayName,
          type: contract.type,
          subtype: contract.subtype,
          source: contract.source,
          hash: contract.hash,
          deploymentOrder: contract.deploymentOrder,
          clarityVersion: contract.clarityVersion,
        }));

        return { contracts: contractData } as ContractsListResponse;
      },
      { path: "/contracts", method: "GET" }
    );
  });

  // Get all contract names
  api.get("/names", (c) => {
    return handleRequest(
      c,
      async () => {
        const contractNames = registry.getAllContractNames();
        return { names: contractNames } as ContractNamesResponse;
      },
      { path: "/names", method: "GET" }
    );
  });

  // Get all available contract names (from CONTRACT_NAMES)
  api.get("/available-names", (c) => {
    return handleRequest(
      c,
      async () => {
        const availableNames = registry.getAllAvailableContractNames();
        return { names: availableNames } as ContractNamesResponse;
      },
      { path: "/available-names", method: "GET" }
    );
  });

  // Get all DAO contract names
  api.get("/dao-names", (c) => {
    return handleRequest(
      c,
      async () => {
        const daoNames = registry.getAllDaoContractNames();
        return { names: daoNames } as ContractNamesResponse;
      },
      { path: "/dao-names", method: "GET" }
    );
  });

  // Get contracts by type
  api.get("/by-type/:type", (c) => {
    return handleRequest(
      c,
      async () => {
        const { type } = c.req.param();

        if (!CONTRACT_TYPES.includes(type as ContractType)) {
          throw new ApiError(ErrorCode.INVALID_CONTRACT_TYPE, { type });
        }

        const contracts = registry.getContractsByType(type as ContractType);

        return {
          type,
          contracts: contracts.map((contract) => ({
            name: contract.name,
            displayName: contract.displayName,
            type: contract.type,
            subtype: contract.subtype,
            source: contract.source,
            hash: contract.hash,
            deploymentOrder: contract.deploymentOrder,
            clarityVersion: contract.clarityVersion,
          })),
        } as ContractsByTypeResponse;
      },
      { path: `/by-type/${c.req.param("type")}`, method: "GET" }
    );
  });

  // Get contract by name
  api.get("/contract/:name", (c) => {
    return handleRequest(
      c,
      async () => {
        const { name } = c.req.param();
        const contract = registry.getContract(name);

        if (!contract) {
          throw new ApiError(ErrorCode.CONTRACT_NOT_FOUND, { name });
        }

        return {
          contract: {
            name: contract.name,
            displayName: contract.displayName,
            type: contract.type,
            subtype: contract.subtype,
            source: contract.source,
            hash: contract.hash,
            deploymentOrder: contract.deploymentOrder,
            clarityVersion: contract.clarityVersion,
          },
        } as ContractDetailResponse;
      },
      { path: `/contract/${c.req.param("name")}`, method: "GET" }
    );
  });

  // Get contract by type and subtype
  api.get("/by-type-subtype/:type/:subtype", (c) => {
    return handleRequest(
      c,
      async () => {
        const { type, subtype } = c.req.param();

        const knownType = CONTRACT_TYPES.find(
          (knownType) => knownType === type
        );

        if (!knownType) {
          throw new ApiError(ErrorCode.INVALID_CONTRACT_TYPE, { type });
        }

        try {
          // Check if the type has the given subtype
          const knownSubtype = CONTRACT_SUBTYPES[type as ContractType].find(
            (knownSubtype) => knownSubtype === subtype
          );
          if (!knownSubtype) {
            throw new ApiError(ErrorCode.CONTRACT_NOT_FOUND, {
              type,
              subtype,
              message: `No contract found for type ${type} and subtype ${subtype}`,
            });
          }
          const contract = registry.getContractByTypeAndSubtype(
            knownType,
            knownSubtype
          );

          if (!contract) {
            throw new ApiError(ErrorCode.CONTRACT_NOT_FOUND, {
              type,
              subtype,
              message: `No contract found for type ${type} and subtype ${subtype}`,
            });
          }

          return {
            contract: {
              name: contract.name,
              displayName: contract.displayName,
              type: contract.type,
              subtype: contract.subtype,
              source: contract.source,
              hash: contract.hash,
              deploymentOrder: contract.deploymentOrder,
              clarityVersion: contract.clarityVersion,
            },
          };
        } catch (error) {
          // If it's already an ApiError, rethrow it
          if (error instanceof ApiError) throw error;

          // Otherwise, throw a more specific error
          throw new ApiError(ErrorCode.INVALID_CONTRACT_SUBTYPE, {
            type,
            subtype,
          });
        }
      },
      {
        path: `/by-type-subtype/${c.req.param("type")}/${c.req.param(
          "subtype"
        )}`,
        method: "GET",
      }
    );
  });

  // Get contract dependencies
  api.get("/dependencies/:name", (c) => {
    return handleRequest(
      c,
      async () => {
        const { name } = c.req.param();
        const contract = registry.getContract(name);

        if (!contract) {
          throw new ApiError(ErrorCode.CONTRACT_NOT_FOUND, { name });
        }

        return {
          name: contract.name,
          dependencies: {
            addresses: contract.requiredAddresses,
            traits: contract.requiredTraits,
            contracts: contract.requiredContractAddresses,
            runtimeValues: contract.requiredRuntimeValues,
          },
        } as ContractDependenciesResponse;
      },
      { path: `/dependencies/${c.req.param("name")}`, method: "GET" }
    );
  });

  // Generate contract for a specific network
  api.post("/generate-contract", async (c) => {
    return handleRequest(
      c,
      async () => {
        const body = await c.req.json();
        const contractName = body.contractName || body.name;
        const network = body.network || "devnet";
        const tokenSymbol = body.tokenSymbol || "aibtc";
        const customReplacements = body.customReplacements || {};

        if (!contractName) {
          throw new ApiError(ErrorCode.INVALID_REQUEST, {
            reason: "Missing required parameter: contractName or name",
          });
        }

        // Validate network
        const validNetworks = ["mainnet", "testnet", "devnet", "mocknet"];
        if (!validNetworks.includes(network)) {
          throw new ApiError(ErrorCode.INVALID_REQUEST, {
            reason: `Invalid network: ${network}. Must be one of: ${validNetworks.join(
              ", "
            )}`,
          });
        }

        const contract = registry.getContract(contractName);
        if (!contract) {
          throw new ApiError(ErrorCode.CONTRACT_NOT_FOUND, {
            name: contractName,
          });
        }

        try {
          const generatedContract =
            await generatorService.generateContractForNetwork(
              contract,
              network as StacksNetworkName,
              tokenSymbol,
              customReplacements,
              c.env
            );

          return {
            network,
            tokenSymbol,
            contract: {
              name: contract.name,
              displayName: contract.displayName,
              type: contract.type,
              subtype: contract.subtype,
              source: generatedContract,
              hash: contract.hash,
              deploymentOrder: contract.deploymentOrder,
              clarityVersion: contract.clarityVersion,
            },
          } as GeneratedContractResponse;
        } catch (error) {
          throw new ApiError(ErrorCode.TEMPLATE_PROCESSING_ERROR, {
            reason: error instanceof Error ? error.message : String(error),
          });
        }
      },
      { path: "/generate-contract-for-network", method: "POST" }
    );
  });

  // Generate all DAO contracts for a network
  api.post("/generate-dao-contracts", async (c) => {
    return handleRequest(
      c,
      async () => {
        const body = await c.req.json();
        const network = body.network || "devnet";
        const tokenSymbol = body.tokenSymbol || "aibtc";
        const customReplacements = body.customReplacements || {};

        // Validate network
        const validNetworks = ["mainnet", "testnet", "devnet", "mocknet"];
        if (!validNetworks.includes(network)) {
          throw new ApiError(ErrorCode.INVALID_REQUEST, {
            reason: `Invalid network: ${network}. Must be one of: ${validNetworks.join(
              ", "
            )}`,
          });
        }

        // Validate token symbol
        if (!tokenSymbol) {
          throw new ApiError(ErrorCode.INVALID_REQUEST, {
            reason: "Missing required parameter: tokenSymbol",
          });
        }

        // Validate custom replacements
        if (typeof customReplacements !== "object") {
          throw new ApiError(ErrorCode.INVALID_REQUEST, {
            reason: "Invalid customReplacements format. Must be an object.",
          });
        }

        // Check if all expected replacements are present
        const expectedReplacements = [
          "dao_token_metadata",
          "origin_address",
          "dao_manifest",
        ];
        for (const replacement of expectedReplacements) {
          if (!customReplacements[replacement]) {
            throw new ApiError(ErrorCode.INVALID_REQUEST, {
              reason: `Missing required custom replacement: ${replacement}`,
            });
          }
        }

        // Get all DAO contract names
        const daoContractNames = registry.getAllDaoContractNames();

        // Generate each contract
        const generatedContracts: GeneratedDaoContractsResponse["contracts"] =
          [];
        const generatedErrors: GeneratedDaoContractsResponse["errors"] = [];

        for (const contractName of daoContractNames) {
          const contract = registry.getContract(contractName);
          if (contract) {
            try {
              const generatedContract =
                await generatorService.generateContractForNetwork(
                  contract,
                  network as StacksNetworkName,
                  tokenSymbol,
                  customReplacements,
                  c.env
                );

              generatedContracts.push({
                name: contract.name,
                displayName: contract.displayName,
                type: contract.type,
                subtype: contract.subtype,
                source: generatedContract,
                hash: contract.hash,
                deploymentOrder: contract.deploymentOrder,
                clarityVersion: contract.clarityVersion,
              });
            } catch (error) {
              // Track errors but continue with other contracts
              generatedErrors.push({
                name: contract.name,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }

        // Make sure we return at least an empty array for contracts
        return {
          network,
          tokenSymbol,
          contracts: generatedContracts.length > 0 ? generatedContracts : [],
          errors: generatedErrors.length > 0 ? generatedErrors : undefined,
        } as GeneratedDaoContractsResponse;
      },
      { path: "/generate-dao-contracts", method: "POST" }
    );
  });

  return api;
}
