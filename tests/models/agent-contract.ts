import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../utilities/contract-deployment-order";
import { ContractSubtype } from "../utilities/contract-types";

export class AgentContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"AGENT">) {
    super(
      name,
      "AGENT",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("AGENT", name)
    );
  }
}
