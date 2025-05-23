import { ClarityVersion } from "@stacks/transactions";
import { KnownAddresses } from "../utilities/known-addresses";
import { ContractSubtype, ContractType } from "../utilities/contract-types";
import { KnownTraits } from "../utilities/known-traits";

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

export interface ContractResponse {
  name: string;
  displayName?: string;
  type: ContractType;
  subtype: ContractSubtype<ContractType>;
  source?: string;
  hash?: string;
  deploymentOrder: number;
  clarityVersion?: ClarityVersion;
}

export abstract class ContractBase {
  readonly name: string;
  readonly type: ContractType;
  readonly subtype: ContractSubtype<ContractType>;
  readonly deploymentOrder: number;
  readonly templatePath: string;
  readonly clarityVersion: ClarityVersion | undefined;
  
  protected _displayName?: string;
  protected _source?: string;
  protected _hash?: string;

  // Generate template path based on contract type
  static generateTemplatePath(type: ContractType, name: string): string {
    switch (type) {
      case "BASE":
        return `dao/${name}.clar`;
      case "ACTIONS":
        return `dao/actions/${name}.clar`;
      case "EXTENSIONS":
        return `dao/extensions/${name}.clar`;
      case "PROPOSALS":
        return `dao/proposals/${name}.clar`;
      case "TOKEN":
        return `dao/token/${name}.clar`;
      case "AGENT":
        return `agent/${name}.clar`;
      default:
        return `${name}.clar`;
    }
  }

  // Dependencies
  readonly requiredAddresses: AddressDependency[] = [];
  readonly requiredTraits: TraitDependency[] = [];
  readonly requiredContractAddresses: ContractDependency[] = [];
  readonly requiredRuntimeValues: RuntimeValue[] = [];

  constructor(
    name: string,
    type: ContractType,
    subtype: ContractSubtype<ContractType>,
    deploymentOrder: number,
    templatePath: string,
    clarityVersion?: ClarityVersion
  ) {
    this.name = name;
    this.type = type;
    this.subtype = subtype;
    this.deploymentOrder = deploymentOrder;
    this.templatePath = templatePath;
    this.clarityVersion = clarityVersion;
  }

  // Getters
  get displayName(): string | undefined {
    return this._displayName;
  }

  get source(): string | undefined {
    return this._source;
  }

  get hash(): string | undefined {
    return this._hash;
  }

  // Setters for generated content
  setDisplayName(displayName: string): this {
    this._displayName = displayName;
    return this;
  }

  setSource(source: string): this {
    this._source = source;
    return this;
  }

  setHash(hash: string): this {
    this._hash = hash;
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

  /**
   * Scan the template content for /g/ variables and add them as dependencies
   * @param templateContent The content of the template file
   */
  scanTemplateVariables(templateContent: string): this {
    // Extract all variables from template
    const variableRegex = /;;\s*\/g\/([^\/]+)\/([^\/]+)/g;
    const matches = [...templateContent.matchAll(variableRegex)];

    // Add each unique variable as a dependency
    const uniqueVars = new Set<string>();

    for (const match of matches) {
      const toReplace = match[1];
      const keyName = match[2];
      const key = `${toReplace}/${keyName}`;

      if (!uniqueVars.has(key)) {
        uniqueVars.add(key);
      }
    }

    return this;
  }

  // Convert to registry entry format for backward compatibility
  /**
   * Get all dependencies for this contract
   */
  getDependencies(): Array<
    AddressDependency | TraitDependency | ContractDependency | RuntimeValue
  > {
    return [
      ...this.requiredAddresses,
      ...this.requiredTraits,
      ...this.requiredContractAddresses,
      ...this.requiredRuntimeValues,
    ];
  }

  toRegistryEntry(): any {
    const entry: any = {
      name: this.name,
      type: this.type,
      subtype: this.subtype,
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

    if (this._displayName) {
      entry.displayName = this._displayName;
    }

    if (this._source) {
      entry.source = this._source;
    }

    if (this._hash) {
      entry.hash = this._hash;
    }

    return entry;
  }
}
