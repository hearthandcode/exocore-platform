import {
  initializePersistenceReview,
  persistenceReviewState,
  resetPersistenceProof,
  runPersistenceProof,
} from "./proof";
import { renderPersistenceReviewPanel } from "./ui";

export function persistenceReviewPanelHtml(): string {
  return renderPersistenceReviewPanel(persistenceReviewState);
}

export function bindPersistenceReviewInteractions(onChange: () => void): void {
  document
    .querySelector<HTMLButtonElement>("#run-persistence-proof")
    ?.addEventListener("click", () => {
      void runPersistenceProof(onChange);
    });
  document
    .querySelector<HTMLButtonElement>("#reset-persistence-proof")
    ?.addEventListener("click", () => {
      void resetPersistenceProof(onChange);
    });
}

export {
  initializePersistenceReview,
  persistenceReviewState,
  resetPersistenceProof,
  runPersistenceProof,
};
