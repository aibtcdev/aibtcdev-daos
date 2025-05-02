import { ContractBase } from "./contract-template";
import {
  DEPLOYMENT_ORDER,
  DeploymentKeys,
} from "../utilities/contract-deployment-order";
import { ContractType } from "../utilities/contract-types";

export class TokenContract extends ContractBase {
  constructor(
    name: DeploymentKeys,
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
