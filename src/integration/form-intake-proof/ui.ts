import type { FormIntakeProofState } from "./proof";

export function renderFormIntakeProofPanel(
  state: FormIntakeProofState,
): string {
  const result = state.result;
  return `
    <section class="boundary-card" aria-labelledby="form-intake-proof-heading">
      <p class="eyebrow">Mounted feature proof · synthetic and local</p>
      <h2 id="form-intake-proof-heading">Form Intake Registry composition</h2>
      <p class="section-note">Manifest-bound · memory adapter · default off · no raw answer projection</p>
      ${state.error ? `<p role="alert"><strong>Proof failed:</strong> ${escapeHtml(state.error)}</p>` : ""}
      <dl>
        <div><dt>Lifecycle</dt><dd>${escapeHtml(state.lifecycle)}</dd></div>
        <div><dt>Fixture</dt><dd>synthetic-only</dd></div>
        <div><dt>Store</dt><dd>in-memory, resettable</dd></div>
        <div><dt>Authority</dt><dd>projection evidence only</dd></div>
      </dl>
      <div class="proof-actions">
        <button id="run-form-intake-proof" type="button" ${state.lifecycle === "running" ? "disabled" : ""}>
          ${state.lifecycle === "running" ? "Running typed workflow…" : "Run mounted intake proof"}
        </button>
        <button id="reset-form-intake-proof" type="button" ${state.lifecycle === "running" || state.lifecycle === "idle" ? "disabled" : ""}>
          Reset and disable
        </button>
      </div>
      ${
        result
          ? `
        <ol class="proof-steps">
          ${result.steps
            .map(
              (step) =>
                `<li><strong>${escapeHtml(step.id)}</strong>: ${escapeHtml(step.evidence)}</li>`,
            )
            .join("")}
        </ol>
        <dl>
          <div><dt>First record</dt><dd>${escapeHtml(shortId(result.first_registry_id))}</dd></div>
          <div><dt>Successor</dt><dd>${escapeHtml(shortId(result.successor_registry_id))}</dd></div>
          <div><dt>Candidates</dt><dd>${result.candidate_count}</dd></div>
          <div><dt>Answered</dt><dd>${result.answered_count}</dd></div>
          <div><dt>Raw answers exposed</dt><dd>${result.raw_answers_exposed ? "yes" : "no"}</dd></div>
          <div><dt>Verification seal</dt><dd>false · human review remains separate</dd></div>
        </dl>
      `
          : "<p>The module is registered but disabled. Running the proof enables it deliberately for one synthetic in-memory workflow.</p>"
      }
    </section>
  `;
}

function shortId(value: string): string {
  return value.length > 22 ? `${value.slice(0, 14)}…${value.slice(-6)}` : value;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
