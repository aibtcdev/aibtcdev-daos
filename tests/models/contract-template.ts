import { ClarityVersion } from "@stacks/transactions";
import { KnownAddresses } from "../utilities/known-addresses";
import { ContractSubtype, ContractType } from "../utilities/contract-types";
import { KnownTraits } from "../utilities/contract-traits";

export interface AddressDependency {
  ref: keyof KnownAddresses; // key in ADDRESSES
  key: string; // key in template
}

export interface TraitDependency {
  ref: keyof KnownTraits; // key in TRAITS
  key: string; // key in template
}

export interface ContractDependency {
  key: string;
  category: ContractType;
  subcategory: ContractSubtype<ContractType>;
}

export interface RuntimeValue {
  key: string;
}

export interface DeploymentResult {
  sender: string; // address from config that deployed
  success: boolean; // deployment success status
  txId?: string; // transaction ID if successful
  address: string; // contract address after deployment
  error?: string; // error message if failed
}

export abstract class ContractBase {
  readonly name: string;
  readonly type: ContractType;
  readonly Subtype: ContractSubtype<ContractType>;
  readonly deploymentOrder: number;
  readonly clarityVersion?: ClarityVersion;
  readonly templatePath: string;

  protected _source?: string;
  protected _hash?: string;
  protected _deploymentResult?: DeploymentResult;

  // Dependencies
  readonly requiredAddresses: AddressDependency[] = [];
  readonly requiredTraits: TraitDependency[] = [];
  readonly requiredContractAddresses: ContractDependency[] = [];
  readonly requiredRuntimeValues: RuntimeValue[] = [];

  constructor(
    name: string,
    type: ContractType,
    Subtype: ContractSubtype<ContractType>,
    deploymentOrder: number,
    templatePath: string,
    clarityVersion?: ClarityVersion
  ) {
    this.name = name;
    this.type = type;
    this.Subtype = Subtype;
    this.deploymentOrder = deploymentOrder;
    this.templatePath = templatePath;
    this.clarityVersion = clarityVersion;
  }

  // Getters
  get source(): string | undefined {
    return this._source;
  }

  get hash(): string | undefined {
    return this._hash;
  }

  get isDeployed(): boolean {
    return !!this._deploymentResult?.success;
  }

  get deploymentResult(): DeploymentResult | undefined {
    return this._deploymentResult;
  }

  // Setters for generated content
  setSource(source: string): this {
    this._source = source;
    return this;
  }

  setHash(hash: string): this {
    this._hash = hash;
    return this;
  }

  setDeploymentResult(result: DeploymentResult): this {
    this._deploymentResult = result;
    return this;
  }

  // Add dependencies
  addAddressDependency(ref: keyof KnownAddresses, key: string): this {
    this.requiredAddresses.push({ ref, key });
    return this;
  }

  addTraitDependency(ref: keyof KnownTraits, key: string): this {
    this.requiredTraits.push({ ref, key });
    return this;
  }

  addContractDependency(
    key: string,
    category: ContractType,
    subcategory: ContractSubtype<ContractType>
  ): this {
    this.requiredContractAddresses.push({ key, category, subcategory });
    return this;
  }

  addRuntimeValue(key: string): this {
    this.requiredRuntimeValues.push({ key });
    return this;
  }

  // Convert to registry entry format for backward compatibility
  toRegistryEntry(): any {
    const entry: any = {
      name: this.name,
      type: this.type,
      Subtype: this.Subtype,
      deploymentOrder: this.deploymentOrder,
      templatePath: this.templatePath,
    };

    if (this.clarityVersion) {
      entry.clarityVersion = this.clarityVersion;
    }

    if (this.requiredAddresses.length > 0) {
      entry.requiredAddresses = [...this.requiredAddresses];
    }

    if (this.requiredTraits.length > 0) {
      entry.requiredTraits = [...this.requiredTraits];
    }

    if (this.requiredContractAddresses.length > 0) {
      entry.requiredContractAddresses = [...this.requiredContractAddresses];
    }

    if (this.requiredRuntimeValues.length > 0) {
      entry.requiredRuntimeValues = [...this.requiredRuntimeValues];
    }

    if (this._source) {
      entry.source = this._source;
    }

    if (this._hash) {
      entry.hash = this._hash;
    }

    if (this._deploymentResult) {
      Object.assign(entry, this._deploymentResult);
    }

    return entry;
  }
}
