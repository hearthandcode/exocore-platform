import { invoke } from "@tauri-apps/api/core";
import type { PersistenceProof, PersistenceStatus } from "./contracts";

export function getPersistenceStatus(): Promise<PersistenceStatus> {
  return invoke<PersistenceStatus>("persistence_status");
}

export function runPersistenceReviewFixture(): Promise<PersistenceProof> {
  return invoke<PersistenceProof>("persistence_run_review_fixture");
}

export function resetPersistenceReviewFixture(): Promise<PersistenceStatus> {
  return invoke<PersistenceStatus>("persistence_reset_review_fixture");
}
