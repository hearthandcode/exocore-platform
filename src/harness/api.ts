import { invoke } from "@tauri-apps/api/core";

export interface FixtureSummary {
  id: string;
  title: string;
  profileId: string;
  profileVersion: string;
}

export interface RunPreview {
  fixtureId: string;
  fixtureTitle: string;
  fixtureHash: string;
  profileHash: string;
  adapterId: string;
  adapterVersion: string;
  endpointClass: string;
  networkPolicy: string;
  credentialPolicy: string;
  maxAttempts: number;
  prompt: string;
  proofLimits: string[];
}

export interface ScoreComponent {
  id: string;
  awarded: number;
  possible: number;
  passed: boolean;
  evidence: string;
}

export interface Score {
  total: number;
  possible: number;
  components: ScoreComponent[];
}

export interface RunReceipt {
  schemaVersion: string;
  runId: string;
  fixtureId: string;
  fixtureHash: string;
  profileHash: string;
  adapterId: string;
  adapterVersion: string;
  endpointClass: string;
  normalizedOutput: string;
  outputHash: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  measurementSource: string;
  score: Score;
  reproducibilityHash: string;
  receiptHash: string;
  createdAtMs: number;
  bundlePath: string;
  proofLimits: string[];
}

export interface VerificationCheck {
  id: string;
  passed: boolean;
  detail: string;
}

export interface ReceiptVerification {
  valid: boolean;
  checks: VerificationCheck[];
}

export function listFixtures(): Promise<FixtureSummary[]> {
  return invoke<FixtureSummary[]>("list_profile_fixtures");
}

export function previewRun(fixtureId: string): Promise<RunPreview> {
  return invoke<RunPreview>("preview_profile_run", { fixtureId });
}

export function runFixture(fixtureId: string): Promise<RunReceipt> {
  return invoke<RunReceipt>("run_profile_fixture", { fixtureId });
}

export function loadLatestReceipt(): Promise<RunReceipt | null> {
  return invoke<RunReceipt | null>("load_latest_profile_receipt");
}

export function verifyReceipt(receipt: RunReceipt): Promise<ReceiptVerification> {
  return invoke<ReceiptVerification>("verify_profile_receipt", { receipt });
}
