import { beforeEach, describe, expect, it, vi } from "vitest";

const { setFeatureModuleEnabled } = vi.hoisted(() => ({
  setFeatureModuleEnabled: vi.fn(async () => undefined),
}));

vi.mock("../../src/foundation", () => ({ setFeatureModuleEnabled }));

import {
  formIntakeProofPanelHtml,
  formIntakeProofState,
  resetFormIntakeProof,
  runFormIntakeProof,
} from "../../src/integration/form-intake-proof";

beforeEach(async () => {
  setFeatureModuleEnabled.mockClear();
  if (formIntakeProofState.lifecycle !== "idle") {
    await resetFormIntakeProof(() => undefined);
    setFeatureModuleEnabled.mockClear();
  }
});

describe("mounted form-intake proof", () => {
  it("composes disabled, ingest, dedupe, projection, stale, and supersession primitives", async () => {
    await runFormIntakeProof(() => undefined);

    expect(setFeatureModuleEnabled).toHaveBeenCalledWith(
      "form-intake-registry",
      true,
    );
    expect(formIntakeProofState.lifecycle).toBe("passed");
    expect(formIntakeProofState.result?.steps.map((step) => step.id)).toEqual([
      "disabled",
      "enable",
      "ingest",
      "dedupe",
      "project",
      "verify",
      "stale",
      "supersede",
    ]);
    expect(formIntakeProofState.result?.candidate_count).toBe(5);
    expect(formIntakeProofState.result?.answered_count).toBe(4);
    expect(formIntakeProofState.result?.raw_answers_exposed).toBe(false);
    expect(formIntakeProofState.result?.verification_state).toBe(false);
  });

  it("renders only metadata evidence and resets to the safe default", async () => {
    await runFormIntakeProof(() => undefined);
    const html = formIntakeProofPanelHtml();

    expect(html).toContain("Form Intake Registry composition");
    expect(html).toContain("Raw answers exposed</dt><dd>no");
    expect(html).not.toContain("A governed synthetic engineering harness");

    await resetFormIntakeProof(() => undefined);
    expect(setFeatureModuleEnabled).toHaveBeenLastCalledWith(
      "form-intake-registry",
      false,
    );
    expect(formIntakeProofState.lifecycle).toBe("idle");
    expect(formIntakeProofState.result).toBeNull();
  });
});
