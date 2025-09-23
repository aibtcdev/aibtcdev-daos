export type FaktoryBridgeContracts = {
  daoName: string;
  dexContract: string;
  ftContract: string;
  poolContract: string;
  preContract: string;
};

// create a mapping of dex IDs to their respective contracts
export const FAKTORY_BRIDGE_CONTRACTS: Record<number, FaktoryBridgeContracts> =
  {
    1: {
      daoName: "facedrop",
      dexContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facedrop-faktory-dex",
      ftContract: "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facedrop-faktory",
      poolContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.xyk-pool-sbtc-facedrop-v-1-1",
      preContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facedrop-pre-faktory",
    },
    2: {
      daoName: "facemelt",
      dexContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facemelt-faktory-dex",
      ftContract: "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facemelt-faktory",
      poolContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.xyk-pool-sbtc-facemelt-v-1-1",
      preContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facemelt-pre-faktory",
    },
    3: {
      daoName: "facevibe",
      dexContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facevibe-faktory-dex",
      ftContract: "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facevibe-faktory",
      poolContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.xyk-pool-sbtc-facevibe-v-1-1",
      preContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facevibe-pre-faktory",
    },
    4: {
      daoName: "facehype",
      dexContract:
        "ST3ZA8Z9DHHM612MYXNT96DJ3E1N7J04ZKQ3H2FSP.facehype-faktory-dex",
      ftContract: "ST3ZA8Z9DHHM612MYXNT96DJ3E1N7J04ZKQ3H2FSP.facehype-faktory",
      poolContract:
        "ST3ZA8Z9DHHM612MYXNT96DJ3E1N7J04ZKQ3H2FSP.xyk-pool-sbtc-facehype-v-1-1",
      preContract:
        "ST3ZA8Z9DHHM612MYXNT96DJ3E1N7J04ZKQ3H2FSP.facehype-pre-faktory",
    },
    5: {
      daoName: "facerizz",
      dexContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facerizz-faktory-dex",
      ftContract: "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facerizz-faktory",
      poolContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.xyk-pool-sbtc-facerizz-v-1-1",
      preContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facerizz-pre-faktory",
    },
    6: {
      daoName: "faces",
      dexContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.faces-faktory-dex",
      ftContract: "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.faces-faktory",
      poolContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.xyk-pool-sbtc-faces-v-1-1",
      preContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.faces-pre-faktory",
    },
    7: {
      daoName: "faces2",
      dexContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.faces2-faktory-dex",
      ftContract: "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.faces2-faktory",
      poolContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.xyk-pool-sbtc-faces2-v-1-1",
      preContract:
        "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.faces2-pre-faktory",
    },
    8: {
      daoName: "faces3",
      dexContract:
        "ST2HQ5J6RP8HSQE9KKGWCHW9PT9SVE4TDGBZQ3EKR.faces3-faktory-dex",
      ftContract: "ST2HQ5J6RP8HSQE9KKGWCHW9PT9SVE4TDGBZQ3EKR.faces3-faktory",
      poolContract:
        "ST2HQ5J6RP8HSQE9KKGWCHW9PT9SVE4TDGBZQ3EKR.xyk-pool-sbtc-faces3-v-1-1",
      preContract:
        "ST2HQ5J6RP8HSQE9KKGWCHW9PT9SVE4TDGBZQ3EKR.faces3-pre-faktory",
    },
  } as const;

export function getFaktoryBridgeContractsById(dexId: number) {
  return (
    FAKTORY_BRIDGE_CONTRACTS[dexId as keyof typeof FAKTORY_BRIDGE_CONTRACTS] ||
    null
  );
}

export function getFaktoryBridgeContractsByDaoName(daoName: string) {
  const entry = Object.values(FAKTORY_BRIDGE_CONTRACTS).find(
    (item) => item.daoName === daoName
  );
  return entry || null;
}

export function getIdFromFaktoryDaoName(daoName: string) {
  const entry = Object.entries(FAKTORY_BRIDGE_CONTRACTS).find(
    ([_id, item]) => item.daoName === daoName
  );
  return entry ? Number(entry[0]) : null;
}
