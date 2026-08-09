import type { PersistenceReviewState } from "./proof";

export function renderPersistenceReviewPanel(
  state: PersistenceReviewState,
): string {
  const status = state.status;
  const proof = state.proof;
  const busy = state.lifecycle === "running" || state.lifecycle === "loading";
  return `
    <section class="boundary-card persistence-lab" aria-labelledby="persistence-review-heading">
      <p class="eyebrow">Human-reviewable desktop test surface · synthetic and local</p>
      <h2 id="persistence-review-heading">Persistence &amp; Language Lab</h2>
      <p class="section-note">SQLite is transitory · PostgreSQL is the forward durable authority · Qdrant and Neo4j are rebuildable projections</p>
      <p class="maturity-disclosure">This lab writes only a deterministic public-safe fixture under the Tauri application-data boundary. It does not ingest the retired form, private Hub material, or provider data.</p>
      <div aria-live="polite" aria-atomic="true">
        <p><strong>Lifecycle:</strong> ${escapeHtml(state.lifecycle)}</p>
        ${state.error ? `<p role="alert"><strong>Persistence proof failed:</strong> ${escapeHtml(state.error)}</p>` : ""}
      </div>
      ${status ? renderStatus(status) : '<p class="muted">Reading the local persistence boundary…</p>'}
      <div class="proof-actions" role="group" aria-label="Persistence proof controls">
        <button id="run-persistence-proof" type="button" ${busy ? "disabled" : ""}>
          ${state.lifecycle === "running" ? "Running transactional proof…" : "Initialize and run persistence proof"}
        </button>
        <button id="reset-persistence-proof" type="button" ${busy || !status?.initialized ? "disabled" : ""}>
          Reset proof namespace and disable
        </button>
      </div>
      ${proof ? renderProof(proof.evidence) : ""}
      <details>
        <summary>Review the language and migration contract</summary>
        <ul>
          <li>Vocabulary: 18 canonical primitives with generated Rust and TypeScript taxonomy types.</li>
          <li>Grammar: module v2 declares lifecycle, ports, operations, effects, migrations, extensions, and proof.</li>
          <li>Schema: eight logical entities have executable SQLite/PostgreSQL column parity.</li>
          <li>Migration: stable IDs, canonical JSON, digests, relations, events, and workflows survive PostgreSQL cutover.</li>
          <li>Projection: Qdrant and Neo4j consume the transactional outbox and never become source authority.</li>
        </ul>
      </details>
      <fieldset class="review-checklist">
        <legend>Operator review prompts</legend>
        <label><input type="checkbox" /> The safe default and local data boundary are clear.</label>
        <label><input type="checkbox" /> The PostgreSQL migration posture is understandable.</label>
        <label><input type="checkbox" /> Projection authority and pending work are visible.</label>
        <label><input type="checkbox" /> The run and reset actions behave as expected.</label>
      </fieldset>
      <p class="section-note">Checklist state is intentionally ephemeral and is not a review decision or verification seal.</p>
    </section>
  `;
}

function renderStatus(
  status: NonNullable<PersistenceReviewState["status"]>,
): string {
  return `
    <dl>
      <div><dt>Adapter</dt><dd>${escapeHtml(status.adapter)}</dd></div>
      <div><dt>Authority role</dt><dd>${escapeHtml(status.authority_role)}</dd></div>
      <div><dt>Enabled</dt><dd>${status.enabled ? "yes" : "no · safe default"}</dd></div>
      <div><dt>Initialized</dt><dd>${status.initialized ? "yes" : "no · zero-write status"}</dd></div>
      <div><dt>Schema version</dt><dd>${status.schema_version}</dd></div>
      <div><dt>Data boundary</dt><dd>${escapeHtml(status.data_boundary)}</dd></div>
      <div><dt>Records / relations / events</dt><dd>${status.record_count} / ${status.relation_count} / ${status.event_count}</dd></div>
      <div><dt>Workflow runs</dt><dd>${status.workflow_run_count}</dd></div>
      <div><dt>Pending projections</dt><dd>${status.pending_projection_count}</dd></div>
      <div><dt>Forward authority</dt><dd>${escapeHtml(status.migration_target)}</dd></div>
      <div><dt>Projection targets</dt><dd>${status.projection_targets.map(escapeHtml).join(" + ")}</dd></div>
      <div><dt>Verification seal</dt><dd>false · human review remains separate</dd></div>
    </dl>
  `;
}

function renderProof(evidence: string[]): string {
  return `
    <h3>Transactional proof evidence</h3>
    <ol class="proof-steps">
      ${evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ol>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
