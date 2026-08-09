import type { IntakeRegistryProjection } from "./contracts";
import { assertIntakeRegistryProjection } from "./validate";

export const INTAKE_REGISTRY_PROJECTION_URL =
  "/intake-registry/intake-registry.v0.2.json";

export async function loadIntakeRegistryProjection(
  fetcher: typeof fetch = fetch,
): Promise<IntakeRegistryProjection> {
  const response = await fetcher(INTAKE_REGISTRY_PROJECTION_URL, {
    cache: "no-store",
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error(
      `Unable to load Intake Registry projection: HTTP ${response.status}`,
    );
  }
  return assertIntakeRegistryProjection(await response.json());
}
