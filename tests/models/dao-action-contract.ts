import { ContractBase } from "./contract-template";
import {
  DEPLOYMENT_ORDER,
  DaoContractAddresses,
} from "../utilities/contract-deployment-order";
import { ContractSubtype } from "../utilities/contract-types";

export class ActionContract extends ContractBase {
  constructor(
    name: DaoContractAddresses, 
    subtype: ContractSubtype<"ACTIONS">
  ) {
    super(
      name,
      "ACTIONS",
      subtype,
      DEPLOYMENT_ORDER[name],
      ContractBase.generateTemplatePath("ACTIONS", name)
    );
  }
}
