import {
  formIntakeProofState,
  resetFormIntakeProof,
  runFormIntakeProof,
} from "./proof";
import { renderFormIntakeProofPanel } from "./ui";

export function formIntakeProofPanelHtml(): string {
  return renderFormIntakeProofPanel(formIntakeProofState);
}

export function bindFormIntakeProofInteractions(onChange: () => void): void {
  document
    .querySelector<HTMLButtonElement>("#run-form-intake-proof")
    ?.addEventListener("click", () => {
      void runFormIntakeProof(onChange);
    });
  document
    .querySelector<HTMLButtonElement>("#reset-form-intake-proof")
    ?.addEventListener("click", () => {
      void resetFormIntakeProof(onChange);
    });
}

export { formIntakeProofState, resetFormIntakeProof, runFormIntakeProof };
export type {
  FormIntakeProofResult,
  FormIntakeProofState,
  ProofLifecycle,
  ProofStep,
} from "./proof";
