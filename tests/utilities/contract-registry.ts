import {
  CONTRACT_NAMES,
  CONTRACT_SUBTYPES,
  CONTRACT_TYPES,
  ContractSubtype,
  ContractType,
} from "./contract-types";
import { ContractBase } from "../models/contract-template";

export class ContractRegistry {
  private contracts: Map<string, ContractBase> = new Map();
  private contractsByType: Map<ContractType, ContractBase[]> = new Map();
  private contractsByTypeAndSubtype: Map<string, ContractBase[]> = new Map();

  constructor() {
    // Initialize maps for each type
    const types: ContractType[] = Object.keys(CONTRACT_TYPES) as ContractType[];
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

    // Add to type+subtype map
    const key = `${contract.type}/${contract.subtype}`;
    const subtypeArray = this.contractsByTypeAndSubtype.get(key) || [];
    subtypeArray.push(contract);
    this.contractsByTypeAndSubtype.set(key, subtypeArray);

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

  // Get contracts by subtype
  getContractsBySubtype<C extends ContractType>(
    type: C,
    subtype: ContractSubtype<C>
  ): ContractBase[] {
    const key = `${type}/${subtype}`;
    return this.contractsByTypeAndSubtype.get(key) || [];
  }

  // Get the contract for a specific type and subtype (assumes one contract per combination)
  getContractByTypeAndSubtype<C extends ContractType>(
    type: C,
    subtype: ContractSubtype<C>
  ): ContractBase | undefined {
    const contracts = this.getContractsBySubtype(type, subtype);
    return contracts.length > 0 ? contracts[0] : undefined;
  }

  // Generate contract name with token symbol
  getConvertedContractName(
    originalName: string,
    tokenSymbol: string,
    replaceText = "aibtc"
  ): string {
    return originalName.replace(replaceText, tokenSymbol.toLowerCase());
  }

  // Helper function to safely access contract names by type and subtype
  private getContractNameByTypeAndSubtype<T extends ContractType>(
    type: T,
    subtype: ContractSubtype<T>
  ): string | undefined {
    // This type assertion tells TypeScript that we're accessing the correct subtype map
    return (CONTRACT_NAMES[type] as any)[subtype];
  }

  // Get all available contract names for a given type
  getContractNamesByType(typeName: string): string[] {
    if (!CONTRACT_TYPES.includes(typeName as ContractType)) {
      return [];
    }

    const type = typeName as ContractType;
    const subtypes = CONTRACT_SUBTYPES[type];
    const names: string[] = [];

    subtypes.forEach((subtype) => {
      const contractName = this.getContractNameByTypeAndSubtype(
        type,
        subtype as ContractSubtype<typeof type>
      );

      if (contractName) {
        names.push(contractName);
      }
    });

    return names;
  }

  // Get all contract names in the registry
  getAllContractNames(): string[] {
    return Array.from(this.contracts.keys());
  }

  // Get all DAO contract names from the CONTRACT_NAMES mapping
  getAllDaoContractNames(): string[] {
    const daoContractNames: string[] = [];

    const daoTypes = ["BASE", "ACTIONS", "EXTENSIONS", "PROPOSALS", "TOKEN"];

    CONTRACT_TYPES.forEach((type) => {
      const subtypes = CONTRACT_SUBTYPES[type];

      subtypes.forEach((subtype) => {
        if (!daoTypes.includes(type)) {
          return;
        }

        const contractName = this.getContractNameByTypeAndSubtype(
          type,
          subtype as ContractSubtype<typeof type>
        );

        if (contractName) {
          daoContractNames.push(contractName);
        }
      });
    });

    return daoContractNames;
  }

  // Get all available contract names from the CONTRACT_NAMES mapping
  getAllAvailableContractNames(): string[] {
    const names: string[] = [];

    CONTRACT_TYPES.forEach((type) => {
      const subtypes = CONTRACT_SUBTYPES[type];

      subtypes.forEach((subtype) => {
        const contractName = this.getContractNameByTypeAndSubtype(
          type,
          subtype as ContractSubtype<typeof type>
        );

        if (contractName) {
          names.push(contractName);
        }
      });
    });

    return names;
  }

  /**                                                                                                                                                                                                                  
 * Creates and registers all contracts defined in CONTRACT_NAMES                                                                                                                                                     
 */                                                                                                                                                                                                                  
registerAllDefinedContracts(): this {                                                                                                                                                                                
  CONTRACT_TYPES.forEach(type => {                                                                                                                                                                                   
    const subtypes = CONTRACT_SUBTYPES[type];                                                                                                                                                                        
                                                                                                                                                                                                                     
    subtypes.forEach(subtype => {                                                                                                                                                                                    
      const contractName = this.getContractNameByTypeAndSubtype(                                                                                                                                                     
        type,                                                                                                                                                                                                        
        subtype as ContractSubtype<typeof type>                                                                                                                                                                      
      );                                                                                                                                                                                                             
                                                                                                                                                                                                                     
      if (contractName) {                                                                                                                                                                                            
        this.createAndRegisterContract(type, contractName, subtype as any);                                                                                                                                          
      }                                                                                                                                                                                                              
    });                                                                                                                                                                                                              
  });                                                                                                                                                                                                                
                                                                                                                                                                                                                     
  return this;                                                                                                                                                                                                       
}                                                                                                                                                                                                                    
                                                                                                                                                                                                                     
/**                                                                                                                                                                                                                  
 * Creates and registers only DAO-related contracts                                                                                                                                                                  
 */                                                                                                                                                                                                                  
registerDaoContracts(): this {                                                                                                                                                                                       
  const daoTypes: ContractType[] = ["BASE", "ACTIONS", "EXTENSIONS", "PROPOSALS", "TOKEN"];                                                                                                                          
                                                                                                                                                                                                                     
  daoTypes.forEach(type => {                                                                                                                                                                                         
    const subtypes = CONTRACT_SUBTYPES[type];                                                                                                                                                                        
                                                                                                                                                                                                                     
    subtypes.forEach(subtype => {                                                                                                                                                                                    
      const contractName = this.getContractNameByTypeAndSubtype(                                                                                                                                                     
        type,                                                                                                                                                                                                        
        subtype as ContractSubtype<typeof type>                                                                                                                                                                      
      );                                                                                                                                                                                                             
                                                                                                                                                                                                                     
      if (contractName) {                                                                                                                                                                                            
        this.createAndRegisterContract(type, contractName, subtype as any);                                                                                                                                          
      }                                                                                                                                                                                                              
    });                                                                                                                                                                                                              
  });                                                                                                                                                                                                                
                                                                                                                                                                                                                     
  return this;                                                                                                                                                                                                       
}                                                                                                                                                                                                                    
                                                                                                                                                                                                                     
/**                                                                                                                                                                                                                  
 * Creates and registers contracts of specific types                                                                                                                                                                 
 */                                                                                                                                                                                                                  
registerContractsByTypes(types: ContractType[]): this {                                                                                                                                                              
  types.forEach(type => {                                                                                                                                                                                            
    const subtypes = CONTRACT_SUBTYPES[type];                                                                                                                                                                        
                                                                                                                                                                                                                     
    subtypes.forEach(subtype => {                                                                                                                                                                                    
      const contractName = this.getContractNameByTypeAndSubtype(                                                                                                                                                     
        type,                                                                                                                                                                                                        
        subtype as ContractSubtype<typeof type>                                                                                                                                                                      
      );                                                                                                                                                                                                             
                                                                                                                                                                                                                     
      if (contractName) {                                                                                                                                                                                            
        this.createAndRegisterContract(type, contractName, subtype as any);                                                                                                                                          
      }                                                                                                                                                                                                              
    });                                                                                                                                                                                                              
  });                                                                                                                                                                                                                
                                                                                                                                                                                                                     
  return this;                                                                                                                                                                                                       
}                                                                                                                                                                                                                    
                                                                                                                                                                                                                     
/**                                                                                                                                                                                                                  
 * Helper method to create and register a contract based on its type                                                                                                                                                 
 */                                                                                                                                                                                                                  
private createAndRegisterContract<T extends ContractType>(                                                                                                                                                           
  type: T,                                                                                                                                                                                                           
  name: string,                                                                                                                                                                                                      
  subtype: ContractSubtype<T>                                                                                                                                                                                        
): ContractBase | null {                                                                                                                                                                                             
  let contract: ContractBase | null = null;                                                                                                                                                                          
                                                                                                                                                                                                                     
  // Create the appropriate contract type                                                                                                                                                                            
  switch (type) {                                                                                                                                                                                                    
    case "BASE":                                                                                                                                                                                                     
      contract = new BaseContract(                                                                                                                                                                                   
        name,                                                                                                                                                                                                        
        subtype as ContractSubtype<"BASE">                                                                                                                                                                           
      );                                                                                                                                                                                                             
      break;                                                                                                                                                                                                         
    case "TOKEN":                                                                                                                                                                                                    
      contract = new TokenContract(                                                                                                                                                                                  
        name,                                                                                                                                                                                                        
        subtype as ContractSubtype<"TOKEN">                                                                                                                                                                          
      );                                                                                                                                                                                                             
      break;                                                                                                                                                                                                         
    case "EXTENSIONS":                                                                                                                                                                                               
      contract = new ExtensionContract(                                                                                                                                                                              
        name,                                                                                                                                                                                                        
        subtype as ContractSubtype<"EXTENSIONS">                                                                                                                                                                     
      );                                                                                                                                                                                                             
      break;                                                                                                                                                                                                         
    case "ACTIONS":                                                                                                                                                                                                  
      contract = new ActionContract(                                                                                                                                                                                 
        name,                                                                                                                                                                                                        
        subtype as ContractSubtype<"ACTIONS">                                                                                                                                                                        
      );                                                                                                                                                                                                             
      break;                                                                                                                                                                                                         
    case "PROPOSALS":                                                                                                                                                                                                
      contract = new ProposalContract(                                                                                                                                                                               
        name,                                                                                                                                                                                                        
        subtype as ContractSubtype<"PROPOSALS">                                                                                                                                                                      
      );                                                                                                                                                                                                             
      break;                                                                                                                                                                                                         
    // We can add other cases as needed                                                                                                                                                                              
    default:                                                                                                                                                                                                         
      return null;                                                                                                                                                                                                   
  }                                                                                                                                                                                                                  
                                                                                                                                                                                                                     
  if (contract) {                                                                                                                                                                                                    
    this.register(contract);                                                                                                                                                                                         
  }                                                                                                                                                                                                                  
                                                                                                                                                                                                                     
  return contract;                                                                                                                                                                                                   
} 
}
