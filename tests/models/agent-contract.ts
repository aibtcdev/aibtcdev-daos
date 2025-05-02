import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../utilities/contract-deployment-order";
import { ContractSubtype, CONTRACT_NAMES } from "../utilities/contract-types";

export class AgentContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"AGENT">) {
    // Validate that the name is a valid contract name for this type/subtype
    const validName = CONTRACT_NAMES.AGENT[subtype];
    if (!validName || name !== validName) {
      throw new Error(`Invalid contract name for AGENT/${subtype}: ${name}`);
    }

    super(
      name,
      "AGENT",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("AGENT", name)
    );
  }
}
