import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../utilities/contract-deployment-order";
import { ContractSubtype, CONTRACT_NAMES } from "../utilities/contract-types";

export class ExtensionContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"EXTENSIONS">) {
    // Validate that the name is a valid contract name for this type/subtype
    const validName = CONTRACT_NAMES.EXTENSIONS[subtype];
    if (!validName || name !== validName) {
      throw new Error(`Invalid contract name for EXTENSIONS/${subtype}: ${name}`);
    }

    super(
      name,
      "EXTENSIONS",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("EXTENSIONS", name)
    );
  }
}
