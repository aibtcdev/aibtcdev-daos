import { dbgLog, DbgLogParams } from "./debug-logging";
import { simnet } from "./simnet";
/**
 *
 * Prints the contents of the assets map to the console.
 */
export function printAssetsMap(params?: DbgLogParams): void {
  const assetsMap = simnet.getAssetsMap();
  dbgLog("===== Assets Map Contents =====", params);
  if (assetsMap.size === 0) {
    dbgLog("(empty)", params);
    return;
  }
  for (const [assetType, principalsMap] of assetsMap) {
    dbgLog(`Asset type: ${assetType}`, params);
    if (principalsMap.size === 0) {
      dbgLog("  (no balances)", params);
      continue;
    }
    for (const [principal, balance] of principalsMap) {
      dbgLog(
        `  Principal: ${principal}, Balance: ${balance.toString()}`,
        params
      );
    }
    dbgLog("----------------------------", params);
  }
  dbgLog("==============================", params);
}

/**
 * Gets all asset balances for a specified principal
 * @param principal The principal address to look up balances for
 * @returns A Map of asset types to their balances for the given principal
 */
export function getBalancesForPrincipal(
  principal: string
): Map<string, bigint> {
  const assetsMap = simnet.getAssetsMap();
  const balances = new Map<string, bigint>();
  dbgLog(`Balances for principal: ${principal}`);
  for (const [assetType, principalsMap] of assetsMap) {
    const balance = principalsMap.get(principal);
    dbgLog(`Asset type: ${assetType}, Balance: ${balance}`);
    if (balance !== undefined) {
      balances.set(assetType, balance);
    }
  }
  return balances;
}

/**
 * Gets the balance of a specific asset type for a specified principal
 * @param principal The principal address to look up
 * @param assetType The specific asset type to get the balance for
 * @returns The balance as a bigint, or undefined if no balance exists
 */
export function getSpecificAssetBalance(
  principal: string,
  assetType: string
): bigint | undefined {
  const assetsMap = simnet.getAssetsMap();
  const principalsMap = assetsMap.get(assetType);
  if (!principalsMap) {
    return undefined;
  }
  return principalsMap.get(principal);
}
