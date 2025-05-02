import { ContractBase } from "./contract-template";
import {
  DEPLOYMENT_ORDER,
  DaoContractAddresses,
} from "../utilities/contract-deployment-order";
import { ContractSubtype } from "../utilities/contract-types";

export class AgentContract extends ContractBase {
  constructor(
    name: DaoContractAddresses,
    subtype: ContractSubtype<"AGENT">
  ) {
    super(
      name,
      "AGENT",
      subtype,
      DEPLOYMENT_ORDER[name],
      ContractBase.generateTemplatePath("AGENT", name)
    );
  }
}
