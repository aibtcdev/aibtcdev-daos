import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../utilities/contract-deployment-order";
import { ContractSubtype } from "../utilities/contract-types";

export class ExtensionContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"EXTENSIONS">) {
    super(
      name,
      "EXTENSIONS",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("EXTENSIONS", name)
    );
  }
}
