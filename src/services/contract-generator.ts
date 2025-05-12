import { ContractBase } from "../../models/contract-template";
import { getContractTemplateContent } from "../../utilities/template-processor";
import {
  processContractTemplate,
  createReplacementsMap,
} from "../../utilities/template-processor";

export class ContractGeneratorService {
  /**
   * Generate a contract from a template
   */
  async generateContract(
    contract: ContractBase,
    replacements: Record<string, string>
  ): Promise<string> {
    // Get the template content
    const templateContent = await getContractTemplateContent(contract);

    // Check if the template content is empty
    if (!templateContent) {
      throw new Error(`Template content for ${contract} is empty`);
    }

    // Process the template with replacements
    const replacementsMap = createReplacementsMap(replacements);
    return processContractTemplate(templateContent, replacementsMap);
  }
}
