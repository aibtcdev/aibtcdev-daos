import { ContractSubtype, ContractType } from "./contract-types";
import { ContractBase } from "../models/contract-template";

export class ContractRegistry {
  private contracts: Map<string, ContractBase> = new Map();
  private contractsByType: Map<ContractType, ContractBase[]> = new Map();
  private contractsByTypeAndSubtype: Map<string, ContractBase[]> = new Map();

  constructor() {
    // Initialize maps for each type
    const types: ContractType[] = [
      "BASE",
      "TOKEN",
      "EXTENSIONS",
      "ACTIONS",
      "PROPOSALS",
    ];
    types.forEach((type) => this.contractsByType.set(type, []));
  }

  // Register a contract with the registry
  register(contract: ContractBase): this {
    // Add to main map
    this.contracts.set(contract.name, contract);

    // Add to type map
    const typeArray = this.contractsByType.get(contract.type) || [];
    typeArray.push(contract);
    this.contractsByType.set(contract.type, typeArray);

    // Add to type+Subtype map
    const key = `${contract.type}/${contract.subtype}`;
    const SubtypeArray = this.contractsByTypeAndSubtype.get(key) || [];
    SubtypeArray.push(contract);
    this.contractsByTypeAndSubtype.set(key, SubtypeArray);

    return this;
  }

  // Get a contract by name
  getContract(name: string): ContractBase | undefined {
    return this.contracts.get(name);
  }

  // Get all contracts
  getAllContracts(): ContractBase[] {
    return Array.from(this.contracts.values());
  }

  // Get contracts by type
  getContractsByType(type: ContractType): ContractBase[] {
    return this.contractsByType.get(type) || [];
  }

  // Get contracts by Subtype
  getContractsBySubtype<C extends ContractType>(
    type: C,
    subtype: ContractSubtype<C>
  ): ContractBase[] {
    const key = `${type}/${subtype}`;
    return this.contractsByTypeAndSubtype.get(key) || [];
  }

  // Get the contract for a specific type and Subtype (assumes one contract per combination)
  getContractByTypeAndSubtype<C extends ContractType>(
    type: C,
    subtype: ContractSubtype<C>
  ): ContractBase | undefined {
    const contracts = this.getContractsBySubtype(type, subtype);
    return contracts.length > 0 ? contracts[0] : undefined;
  }

  // Generate contract name with token symbol
  getContractName(
    originalName: string,
    tokenSymbol: string,
    replaceText = "aibtc"
  ): string {
    return originalName.replace(replaceText, tokenSymbol.toLowerCase());
  }
}
