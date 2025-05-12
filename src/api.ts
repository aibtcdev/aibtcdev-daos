import { Hono } from "hono";
import { CloudflareBindings } from "./cf-types";
import { ContractRegistry } from "../utilities/contract-registry";
import {
  ContractType,
  ContractSubtype,
  CONTRACT_TYPES,
  CONTRACT_SUBTYPES,
} from "../utilities/contract-types";
import { getContractTemplateContent } from "../utilities/template-processor";

export function createApiRouter(registry: ContractRegistry) {
  const api = new Hono<{ Bindings: CloudflareBindings }>();

  // Get all contract types and their subtypes
  api.get("/types", (c) => {
    const result: Record<string, string[]> = {};

    CONTRACT_TYPES.forEach((type) => {
      result[type] = CONTRACT_SUBTYPES[type]
        ? Object.values(CONTRACT_SUBTYPES[type])
        : [];
    });

    return c.json({
      success: true,
      types: result,
    });
  });

  // Get all contracts in the registry
  api.get("/contracts", (c) => {
    const contracts = registry.getAllContracts();
    const contractData = contracts.map((contract) => ({
      name: contract.name,
      type: contract.type,
      subtype: contract.subtype,
      deploymentOrder: contract.deploymentOrder,
      isDeployed: contract.isDeployed,
    }));

    return c.json({
      success: true,
      contracts: contractData,
    });
  });

  // Get all contract names
  api.get("/names", (c) => {
    const contractNames = registry.getAllContractNames();
    return c.json({
      success: true,
      names: contractNames,
    });
  });

  // Get all available contract names (from CONTRACT_NAMES)
  api.get("/available-names", (c) => {
    const availableNames = registry.getAllAvailableContractNames();
    return c.json({
      success: true,
      names: availableNames,
    });
  });

  // Get all DAO contract names
  api.get("/dao-names", (c) => {
    const daoNames = registry.getAllDaoContractNames();
    return c.json({
      success: true,
      names: daoNames,
    });
  });

  // Get contracts by type
  api.get("/by-type/:type", (c) => {
    const { type } = c.req.param();

    if (!CONTRACT_TYPES.includes(type as ContractType)) {
      return c.json({ error: `Invalid contract type: ${type}` }, 400);
    }

    const contracts = registry.getContractsByType(type as ContractType);

    return c.json({
      success: true,
      type,
      contracts: contracts.map((contract) => ({
        name: contract.name,
        subtype: contract.subtype,
        deploymentOrder: contract.deploymentOrder,
        isDeployed: contract.isDeployed,
      })),
    });
  });

  // Get contract by name
  api.get("/contract/:name", (c) => {
    const { name } = c.req.param();
    const contract = registry.getContract(name);

    if (!contract) {
      return c.json({ error: `Contract not found: ${name}` }, 404);
    }

    return c.json({
      success: true,
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
    });
  });

  // Get contract by type and subtype
  api.get("/by-type-subtype/:type/:subtype", (c) => {
    const { type, subtype } = c.req.param();

    if (!CONTRACT_TYPES.includes(type as ContractType)) {
      return c.json({ error: `Invalid contract type: ${type}` }, 400);
    }

    const contract = registry.getContractByTypeAndSubtype(
      type as ContractType,
      subtype as ContractSubtype<typeof type>
    );

    if (!contract) {
      return c.json(
        {
          error: `No contract found for type: ${type}, subtype: ${subtype}`,
        },
        404
      );
    }

    return c.json({
      success: true,
      contract: {
        name: contract.name,
        type: contract.type,
        subtype: contract.subtype,
        templatePath: contract.templatePath,
        deploymentOrder: contract.deploymentOrder,
        isDeployed: contract.isDeployed,
      },
    });
  });

  // Get contract dependencies
  api.get("/dependencies/:name", (c) => {
    const { name } = c.req.param();
    const contract = registry.getContract(name);

    if (!contract) {
      return c.json({ error: `Contract not found: ${name}` }, 404);
    }

    return c.json({
      success: true,
      name: contract.name,
      dependencies: {
        addresses: contract.requiredAddresses,
        traits: contract.requiredTraits,
        contracts: contract.requiredContracts,
        runtimeValues: contract.requiredRuntimeValues,
      },
    });
  });

  // Process a contract template with replacements
  api.post("/process-template", async (c) => {
    try {
      const body = await c.req.json();
      const { name, replacements } = body;

      if (!name) {
        return c.json({ error: "Missing required parameter: name" }, 400);
      }

      const contract = registry.getContract(name);

      if (!contract) {
        return c.json({ error: `Contract not found: ${name}` }, 404);
      }

      // Read the contract template content
      const templateContent = await getContractTemplateContent(contract);

      if (!templateContent) {
        return c.json({ error: "Template content not available" }, 404);
      }

      // Process the template with the provided replacements
      const processedContent = registry.processTemplate(
        contract,
        templateContent,
        replacements || {}
      );

      return c.json({
        success: true,
        contract: {
          name: contract.name,
          type: contract.type,
          subtype: contract.subtype,
          content: processedContent,
        },
      });
    } catch (error) {
      return c.json(
        { error: `Error processing request: ${error.message}` },
        500
      );
    }
  });

  return api;
}
