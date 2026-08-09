import type { ArtifactSurfaceProjection } from "./contracts";
import { assertArtifactSurfaceProjection } from "./validate";

export const ARTIFACT_SURFACE_PROJECTION_URL =
  "/artifact-surface/artifact-surface.v0.1.json";

export async function loadArtifactSurfaceProjection(
  fetcher: typeof fetch = fetch,
): Promise<ArtifactSurfaceProjection> {
  const response = await fetcher(ARTIFACT_SURFACE_PROJECTION_URL, {
    cache: "no-store",
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error(`Unable to load Artifact Surface projection: HTTP ${response.status}`);
  }
  return assertArtifactSurfaceProjection(await response.json());
}
