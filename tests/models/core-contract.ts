import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../utilities/contract-deployment-order";
import { ContractSubtype, CONTRACT_NAMES } from "../utilities/contract-types";

export class CoreContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"CORE">) {
    // Validate that the name is a valid contract name for this type/subtype
    const validName = CONTRACT_NAMES.CORE[subtype];
    if (!validName || name !== validName) {
      throw new Error(`Invalid contract name for CORE/${subtype}: ${name}`);
    }

    super(
      name,
      "CORE",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("CORE", name)
    );
  }
}
