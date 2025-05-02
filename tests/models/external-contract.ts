import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../utilities/contract-deployment-order";
import { ContractSubtype, CONTRACT_NAMES } from "../utilities/contract-types";

export class ExternalContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"EXTERNAL">) {
    // Validate that the name is a valid contract name for this type/subtype
    const validName = CONTRACT_NAMES.EXTERNAL[subtype];
    if (!validName || name !== validName) {
      throw new Error(`Invalid contract name for EXTERNAL/${subtype}: ${name}`);
    }

    super(
      name,
      "EXTERNAL",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("EXTERNAL", name)
    );
  }
}
