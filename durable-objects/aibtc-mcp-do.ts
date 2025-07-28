import { z } from "zod";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ContractGeneratorService } from "../src/services/contract-generator";
import { CloudflareBindings } from "../src/cf-types";
import { ContractRegistry } from "../utilities/contract-registry";
import { DurableObjectState } from "@cloudflare/workers-types";

export class AIBTC_MCP_DO extends McpAgent {
  server = new McpServer({ name: "AIBTC", version: "1.0.0" });
  private registry: ContractRegistry;
  private generatorService: ContractGeneratorService;

  constructor(state: DurableObjectState, env: CloudflareBindings) {
    super(state, env);
    this.registry = new ContractRegistry();
    this.generatorService = new ContractGeneratorService();
  }

  async init() {
    // Add contract generation tool
    this.server.tool(
      "generate-contract",
      {
        contractName: z.string(),
        replacements: z.record(z.string()).optional().default({}),
      },
      async ({ contractName, replacements }) => {
        const contract = this.registry.getContract(contractName);
        if (!contract) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Contract ${contractName} not found`,
              },
            ],
          };
        }

        try {
          const generatedContract =
            await this.generatorService.generateContract(
              contract,
              replacements
            );

          return {
            content: [{ type: "text", text: generatedContract }],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error generating contract: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );
  }
}
