import { ContractBase } from "./contract-template";
import {
  DEPLOYMENT_ORDER,
  DaoContractAddresses,
} from "../utilities/contract-deployment-order";
import { ContractType } from "../utilities/contract-types";

export class TokenContract extends ContractBase {
  constructor(
    name: DaoContractAddresses,
    Subtype: "DAO" | "PRELAUNCH" | "DEX" | "POOL"
  ) {
    super(
      name,
      "TOKEN" as ContractType,
      Subtype,
      DEPLOYMENT_ORDER[name],
      `tokens/${name}.clar`
    );
  }
}
