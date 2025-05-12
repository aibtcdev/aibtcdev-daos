import { initSimnet, Simnet } from "@hirosystems/clarinet-sdk";

const simnetInitializer = async () =>
  await initSimnet("Clarinet.toml", false, {
    trackCosts: true,
    trackCoverage: true,
  });

export const simnet = await simnetInitializer();
