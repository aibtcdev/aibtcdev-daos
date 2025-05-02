import { ContractBase } from "./contract-template";
import {
  DEPLOYMENT_ORDER,
  DaoContractAddresses,
} from "../utilities/contract-deployment-order";
import { ContractSubtype } from "../utilities/contract-types";

export class TokenContract extends ContractBase {
  constructor(name: DaoContractAddresses, subtype: ContractSubtype<"TOKEN">) {
    super(
      name,
      "TOKEN",
      subtype,
      DEPLOYMENT_ORDER[name],
      ContractBase.generateTemplatePath("TOKEN", name)
    );
  }
}
