import { ContractBase } from "./contract-template";
import {
  DEPLOYMENT_ORDER,
  DaoContractAddresses,
} from "../utilities/contract-deployment-order";
import { ContractSubtype } from "../utilities/contract-types";

export class ProposalContract extends ContractBase {
  constructor(
    name: DaoContractAddresses, 
    subtype: ContractSubtype<"PROPOSALS">
  ) {
    super(
      name,
      "PROPOSALS",
      subtype,
      DEPLOYMENT_ORDER[name],
      ContractBase.generateTemplatePath("PROPOSALS", name)
    );
  }
}
