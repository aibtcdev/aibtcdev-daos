import { Hono } from "hono";
import { StacksNetworkName } from "@stacks/network";
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

        return { types: result };
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
          type: contract.type,
          subtype: contract.subtype,
          deploymentOrder: contract.deploymentOrder,
          isDeployed: contract.isDeployed,
        }));

        return { contracts: contractData };
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
        return { names: contractNames };
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
        return { names: availableNames };
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
        return { names: daoNames };
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
            subtype: contract.subtype,
            deploymentOrder: contract.deploymentOrder,
            isDeployed: contract.isDeployed,
          })),
        };
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
            type: contract.type,
            subtype: contract.subtype,
            templatePath: contract.templatePath,
            deploymentOrder: contract.deploymentOrder,
            isDeployed: contract.isDeployed,
            source: contract.source,
            hash: contract.hash,
            deploymentResult: contract.deploymentResult,
          },
        };
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
              type: contract.type,
              subtype: contract.subtype,
              templatePath: contract.templatePath,
              deploymentOrder: contract.deploymentOrder,
              isDeployed: contract.isDeployed,
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
        };
      },
      { path: `/dependencies/${c.req.param("name")}`, method: "GET" }
    );
  });

  // Generate contract from template
  api.post("/generate-contract", async (c) => {
    return handleRequest(
      c,
      async () => {
        const body = await c.req.json();
        // Support both name and contractName parameters for backward compatibility
        const contractName = body.contractName || body.name;
        const replacements = body.replacements || {};

        if (!contractName) {
          throw new ApiError(ErrorCode.INVALID_REQUEST, {
            reason: "Missing required parameter: contractName or name",
          });
        }

        const contract = registry.getContract(contractName);
        if (!contract) {
          throw new ApiError(ErrorCode.CONTRACT_NOT_FOUND, {
            name: contractName,
          });
        }

        try {
          const generatedContract = await generatorService.generateContract(
            contract,
            replacements,
            c.env
          );

          return {
            contract: {
              name: contract.name,
              type: contract.type,
              subtype: contract.subtype,
              content: generatedContract,
            },
          };
        } catch (error) {
          throw new ApiError(ErrorCode.TEMPLATE_PROCESSING_ERROR, {
            reason: error instanceof Error ? error.message : String(error),
          });
        }
      },
      { path: "/generate-contract", method: "POST" }
    );
  });

  // Generate contract for a specific network
  api.post("/generate-contract-for-network", async (c) => {
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
            contract: {
              name: contract.name,
              type: contract.type,
              subtype: contract.subtype,
              network,
              tokenSymbol,
              content: generatedContract,
            },
          };
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

        // Get all DAO contract names
        const daoContractNames = registry.getAllDaoContractNames();

        // Generate each contract
        const generatedContracts: Array<{
          name: string;
          type: ContractType;
          subtype: string;
          content: string;
        }> = [];
        const errors: Array<{
          name: string;
          error: string;
        }> = [];

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
                type: contract.type,
                subtype: contract.subtype,
                content: generatedContract,
              });
            } catch (error) {
              // Track errors but continue with other contracts
              errors.push({
                name: contract.name,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }

        return {
          network,
          tokenSymbol,
          contracts: generatedContracts,
          errors: errors.length > 0 ? errors : undefined,
        };
      },
      { path: "/generate-dao-contracts", method: "POST" }
    );
  });

  return api;
}
