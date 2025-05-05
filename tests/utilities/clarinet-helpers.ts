import { dbgLog } from "./debug-logging";

/**
 *
 * Prints the contents of the assets map to the console.
 * @param assetsMap The assets map from simnet.getAssetsMap()
 */
export function printAssetsMap(
  assetsMap: Map<string, Map<string, bigint>>
): void {
  dbgLog("===== Assets Map Contents =====");

  if (assetsMap.size === 0) {
    dbgLog("(empty)");
    return;
  }

  for (const [assetType, principalsMap] of assetsMap) {
    dbgLog(`Asset type: ${assetType}`);

    if (principalsMap.size === 0) {
      dbgLog("  (no balances)");
      continue;
    }

    for (const [principal, balance] of principalsMap) {
      dbgLog(`  Principal: ${principal}, Balance: ${balance.toString()}`);
    }
    dbgLog("----------------------------");
  }

  dbgLog("==============================");
}

/**
 * Gets all asset balances for a specified principal
 * @param assetsMap The assets map from simnet.getAssetsMap()
 * @param principal The principal address to look up balances for
 * @returns A Map of asset types to their balances for the given principal
 */
export function getBalancesForPrincipal(
  assetsMap: Map<string, Map<string, bigint>>,
  principal: string
): Map<string, bigint> {
  const balances = new Map<string, bigint>();

  for (const [assetType, principalsMap] of assetsMap) {
    const balance = principalsMap.get(principal);
    if (balance !== undefined) {
      balances.set(assetType, balance);
    }
  }

  return balances;
}

/**
 * Gets the balance of a specific asset type for a specified principal
 * @param assetsMap The assets map from simnet.getAssetsMap()
 * @param principal The principal address to look up
 * @param assetType The specific asset type to get the balance for
 * @returns The balance as a bigint, or undefined if no balance exists
 */
export function getSpecificAssetBalance(
  assetsMap: Map<string, Map<string, bigint>>,
  principal: string,
  assetType: string
): bigint | undefined {
  const principalsMap = assetsMap.get(assetType);
  if (!principalsMap) {
    return undefined;
  }

  return principalsMap.get(principal);
}
