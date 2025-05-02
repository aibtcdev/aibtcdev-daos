import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../utilities/contract-deployment-order";
import { ContractSubtype, CONTRACT_NAMES } from "../utilities/contract-types";

export class ProposalContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"PROPOSALS">) {
    // Validate that the name is a valid contract name for this type/subtype
    const validName = CONTRACT_NAMES.PROPOSALS[subtype];
    if (!validName || name !== validName) {
      throw new Error(`Invalid contract name for PROPOSALS/${subtype}: ${name}`);
    }

    super(
      name,
      "PROPOSALS",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("PROPOSALS", name)
    );
  }
}
