import { Hono } from "hono";
import { CloudflareBindings } from "./cf-types";
import { setupFullContractRegistry } from "../utilities/contract-registry";
import { ContractType, ContractSubtype, CONTRACT_TYPES, CONTRACT_SUBTYPES } from "../utilities/contract-types";
import { getContractTemplateContent } from "../utilities/template-processor";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Create a shared registry instance
const registry = setupFullContractRegistry();

app.get("/", (c) => {
  return c.text("AI-powered Bitcoin DAOs");
});

// Get all available contract types and subtypes
app.get("/api/contract-types", (c) => {
  const result: Record<string, string[]> = {};
  
  CONTRACT_TYPES.forEach(type => {
    result[type] = CONTRACT_SUBTYPES[type];
  });
  
  return c.json({
    success: true,
    types: result
  });
});

// Process a contract template with replacements
app.post("/api/contract-template", async (c) => {
  try {
    const body = await c.req.json();
    
    // Extract parameters from request body
    const { type, subtype, replacements } = body;
    
    if (!type || !subtype) {
      return c.json({ error: "Missing required parameters: type and subtype" }, 400);
    }
    
    // Get the contract by type and subtype
    const contract = registry.getContractByTypeAndSubtype(
      type as ContractType, 
      subtype as ContractSubtype<typeof type>
    );
    
    if (!contract) {
      return c.json({ error: `Contract not found for type: ${type}, subtype: ${subtype}` }, 404);
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
        content: processedContent
      }
    });
  } catch (error) {
    return c.json({ error: `Error processing request: ${error.message}` }, 500);
  }
});

app.mount(
  "/sse",
  (req, env) => {
    return env.AIBTC_MCP_DO.serveSSE("/sse").fetch(req);
  },
  {
    replaceRequest: false,
  }
);

app.mount(
  "/mcp",
  (req, env) => {
    return env.AIBTC_MCP_DO.serve("/mcp").fetch(req);
  },
  {
    replaceRequest: false,
  }
);

export default app;
