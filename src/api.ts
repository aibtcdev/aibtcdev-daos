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

  // Get all available contract types and subtypes
  api.get("/contract-types", (c) => {
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

  // Get all available contract subtypes for a specific type
  api.get("/contract-subtypes/:type", (c) => {
    const { type } = c.req.param();
    const subtypes = CONTRACT_SUBTYPES[type as ContractType];
    if (!subtypes) {
      return c.json(
        { error: `No subtypes found for contract type: ${type}` },
        404
      );
    }
    return c.json({
      success: true,
      type,
      subtypes: Object.values(subtypes),
    });
  });

  // Get all available contract names
  api.get("/contract-names", (c) => {
    const contractNames = registry.getAllContractNames();
    return c.json({
      success: true,
      contractNames,
    });
  });

  // Process a contract template with replacements
  api.post("/contract-template", async (c) => {
    try {
      const body = await c.req.json();

      // Extract parameters from request body
      const { type, subtype, replacements } = body;

      if (!type || !subtype) {
        return c.json(
          { error: "Missing required parameters: type and subtype" },
          400
        );
      }

      // Get the contract by type and subtype
      const contract = registry.getContractByTypeAndSubtype(
        type as ContractType,
        subtype as ContractSubtype<typeof type>
      );

      if (!contract) {
        return c.json(
          { error: `Contract not found for type: ${type}, subtype: ${subtype}` },
          404
        );
      }

      // Read the contract template content from the contracts directory
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

      // Return the processed template
      return c.json({
        success: true,
        contract: {
          name: contract.name,
          type,
          subtype,
          content: processedContent,
        },
      });
    } catch (error) {
      return c.json({ error: `Error processing request: ${error.message}` }, 500);
    }
  });

  // Get deployment status and addresses for all contracts
  api.get("/contracts/deployed", (c) => {
    const contracts = registry.getAllContracts();
    const deploymentInfo = contracts.map(contract => ({
      name: contract.name,
      type: contract.type,
      subtype: contract.subtype,
      isDeployed: contract.isDeployed,
      address: contract.deploymentResult?.address,
      txId: contract.deploymentResult?.txId
    }));
    
    return c.json({
      success: true,
      contracts: deploymentInfo
    });
  });

  // Get contract by name with full details
  api.get("/contracts/:name", (c) => {
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
        deploymentResult: contract.deploymentResult
      }
    });
  });

  // Get contract dependencies
  api.get("/contracts/:name/dependencies", (c) => {
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
        runtimeValues: contract.requiredRuntimeValues
      }
    });
  });

  // Get all contracts of a specific type
  api.get("/contracts/by-type/:type", (c) => {
    const { type } = c.req.param();
    
    if (!CONTRACT_TYPES.includes(type as ContractType)) {
      return c.json({ error: `Invalid contract type: ${type}` }, 400);
    }
    
    const contracts = registry.getContractsByType(type as ContractType);
    
    return c.json({
      success: true,
      type,
      contracts: contracts.map(contract => ({
        name: contract.name,
        subtype: contract.subtype,
        isDeployed: contract.isDeployed
      }))
    });
  });

  // Get all DAO contracts
  api.get("/contracts/dao", (c) => {
    const daoContractNames = registry.getAllDaoContractNames();
    const daoContracts = daoContractNames
      .map(name => registry.getContract(name))
      .filter(Boolean);
    
    return c.json({
      success: true,
      contracts: daoContracts.map(contract => ({
        name: contract.name,
        type: contract.type,
        subtype: contract.subtype,
        isDeployed: contract.isDeployed
      }))
    });
  });

  return api;
}
