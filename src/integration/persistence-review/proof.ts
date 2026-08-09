import {
  getPersistenceStatus,
  resetPersistenceReviewFixture,
  runPersistenceReviewFixture,
  type PersistenceProof,
  type PersistenceStatus,
} from "../../persistence";
import { setFeatureModuleEnabled } from "../../foundation";

export type PersistenceReviewLifecycle =
  "loading" | "idle" | "running" | "passed" | "failed";

export interface PersistenceReviewState {
  lifecycle: PersistenceReviewLifecycle;
  status: PersistenceStatus | null;
  proof: PersistenceProof | null;
  error: string | null;
}

export const persistenceReviewState: PersistenceReviewState = {
  lifecycle: "loading",
  status: null,
  proof: null,
  error: null,
};

export async function initializePersistenceReview(
  onChange: () => void,
): Promise<void> {
  persistenceReviewState.lifecycle = "loading";
  onChange();
  try {
    persistenceReviewState.status = await getPersistenceStatus();
    persistenceReviewState.lifecycle = persistenceReviewState.status.initialized
      ? "idle"
      : "idle";
    persistenceReviewState.error = null;
  } catch (error) {
    fail(error);
  }
  onChange();
}

export async function runPersistenceProof(onChange: () => void): Promise<void> {
  if (persistenceReviewState.lifecycle === "running") return;
  persistenceReviewState.lifecycle = "running";
  persistenceReviewState.error = null;
  persistenceReviewState.proof = null;
  onChange();
  try {
    await setFeatureModuleEnabled("persistence", true);
    const proof = await runPersistenceReviewFixture();
    persistenceReviewState.proof = proof;
    persistenceReviewState.status = proof.status;
    persistenceReviewState.lifecycle = "passed";
  } catch (error) {
    await setFeatureModuleEnabled("persistence", false).catch(() => undefined);
    fail(error);
  }
  onChange();
}

export async function resetPersistenceProof(
  onChange: () => void,
): Promise<void> {
  if (persistenceReviewState.lifecycle === "running") return;
  persistenceReviewState.lifecycle = "running";
  persistenceReviewState.error = null;
  onChange();
  try {
    await setFeatureModuleEnabled("persistence", true);
    await resetPersistenceReviewFixture();
    await setFeatureModuleEnabled("persistence", false);
    persistenceReviewState.status = await getPersistenceStatus();
    persistenceReviewState.proof = null;
    persistenceReviewState.lifecycle = "idle";
  } catch (error) {
    fail(error);
  }
  onChange();
}

function fail(error: unknown): void {
  persistenceReviewState.lifecycle = "failed";
  persistenceReviewState.error =
    error instanceof Error ? error.message : "persistence review failed";
}
