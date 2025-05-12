import { ContractBase } from "./contract-template";
import { DEPLOYMENT_ORDER } from "../../utilities/contract-deployment-order";
import { ContractSubtype } from "../../utilities/contract-types";

export class ProposalContract extends ContractBase {
  constructor(name: string, subtype: ContractSubtype<"PROPOSALS">) {
    super(
      name,
      "PROPOSALS",
      subtype,
      DEPLOYMENT_ORDER[name] || 0,
      ContractBase.generateTemplatePath("PROPOSALS", name)
    );
  }
}
