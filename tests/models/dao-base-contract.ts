import { ContractBase } from "./contract-template";
import {
  DEPLOYMENT_ORDER,
  DaoContractAddresses,
} from "../utilities/contract-deployment-order";
import { ContractSubtype, ContractType } from "../utilities/contract-types";

export class BaseContract extends ContractBase {
  constructor(
    name: DaoContractAddresses,
    subtype: ContractSubtype<"BASE">
  ) {
    super(
      name,
      "BASE",
      subtype,
      DEPLOYMENT_ORDER[name],
      ContractBase.generateTemplatePath("BASE", name)
    );
  }
}
