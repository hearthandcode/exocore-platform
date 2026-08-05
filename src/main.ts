import "./style.css";
import {
  listFixtures,
  loadLatestReceipt,
  previewRun,
  runFixture,
  verifyReceipt,
  type FixtureSummary,
  type ReceiptVerification,
  type RunPreview,
  type RunReceipt,
} from "./harness/api";
import { APP_VERSION, PRODUCT_LIMITS, RELEASE_LABEL } from "./harness/contracts";

interface WorkroomState {
  fixtures: FixtureSummary[];
  selectedFixtureId: string | null;
  preview: RunPreview | null;
  receipt: RunReceipt | null;
  verification: ReceiptVerification | null;
  busy: boolean;
  error: string | null;
}

const state: WorkroomState = {
  fixtures: [],
  selectedFixtureId: null,
  preview: null,
  receipt: null,
  verification: null,
  busy: true,
  error: null,
};

const rootElement = document.querySelector<HTMLDivElement>("#app");
if (!rootElement) {
  throw new Error("Exocore application root is missing");
}
const root: HTMLDivElement = rootElement;

async function boot(): Promise<void> {
  render();
  try {
    const [fixtures, latest] = await Promise.all([listFixtures(), loadLatestReceipt()]);
    state.fixtures = fixtures;
    state.selectedFixtureId = fixtures[0]?.id ?? null;
    if (state.selectedFixtureId) {
      state.preview = await previewRun(state.selectedFixtureId);
    }
    if (latest) {
      state.receipt = latest;
      state.verification = await verifyReceipt(latest);
    }
  } catch (error) {
    state.error = describeError(error);
  } finally {
    state.busy = false;
    render();
  }
}

async function selectFixture(fixtureId: string): Promise<void> {
  state.selectedFixtureId = fixtureId;
  state.preview = null;
  state.error = null;
  state.busy = true;
  render();
  try {
    state.preview = await previewRun(fixtureId);
  } catch (error) {
    state.error = describeError(error);
  } finally {
    state.busy = false;
    render();
  }
}

async function executeRun(): Promise<void> {
  if (!state.selectedFixtureId || state.busy) return;
  state.busy = true;
  state.error = null;
  state.receipt = null;
  state.verification = null;
  render();
  try {
    const receipt = await runFixture(state.selectedFixtureId);
    state.receipt = receipt;
    state.verification = await verifyReceipt(receipt);
  } catch (error) {
    state.error = describeError(error);
  } finally {
    state.busy = false;
    render();
  }
}

function render(): void {
  root.innerHTML = `
    <div class="app-shell">
      <header class="masthead">
        <div>
          <p class="eyebrow">Hearth &amp; Code Workbench · ${escapeHtml(RELEASE_LABEL)}</p>
          <h1>Profile Evaluation Workroom</h1>
          <p class="lede">Run a bounded profile fixture, inspect deterministic scoring, and verify an append-only application receipt.</p>
          <p class="maturity-strip">Bounded local proof · deterministic mock · no provider call</p>
        </div>
        <div class="release-mark" role="group" aria-label="Application version">
          <span>v${escapeHtml(APP_VERSION)}</span>
          <strong>local only</strong>
        </div>
      </header>

      <div class="workroom-grid">
        <aside class="sidebar" aria-label="Evaluation fixtures">
          <h2>Fixture library</h2>
          <p class="section-note">Bundled public-safe contracts</p>
          <div class="fixture-list">
            ${renderFixtures()}
          </div>
          <div class="boundary-card">
            <h3>v0.0.1 boundary</h3>
            <ul>${PRODUCT_LIMITS.map((limit) => `<li>${escapeHtml(limit)}</li>`).join("")}</ul>
            <p class="maturity-disclosure">This pre-alpha runs one synthetic, local profile-evaluation fixture through a Rust-controlled deterministic mock. It writes an application receipt and checks that receipt for internal consistency. It does not call a model or provider, access private work, or establish truth, safety, quality, or cognitive benefit.</p>
          </div>
        </aside>

        <main class="main-panel">
          ${state.error ? renderError(state.error) : ""}
          ${state.busy && !state.preview ? renderLoading("Loading bounded fixture contract") : ""}
          ${state.preview ? renderPreview(state.preview) : ""}
          ${state.busy && state.preview ? renderLoading("Executing deterministic mock and sealing receipt") : ""}
          ${state.receipt ? renderReceipt(state.receipt, state.verification) : renderEmptyReceipt()}
        </main>
      </div>

      <footer>
        <span>Rust control plane</span>
        <span>TypeScript workroom</span>
        <span>Optional Python worker protocol</span>
        <span>No provider call</span>
        <span>Exocore architecture · compatibility identifiers retained</span>
      </footer>
    </div>
  `;
  bindInteractions();
}

function renderFixtures(): string {
  if (state.fixtures.length === 0) {
    return '<p class="muted">No validated fixtures available.</p>';
  }
  return state.fixtures
    .map((fixture) => {
      const selected = fixture.id === state.selectedFixtureId;
      return `
        <button class="fixture-button${selected ? " selected" : ""}" data-fixture-id="${escapeAttribute(fixture.id)}" ${state.busy ? "disabled" : ""}>
          <span>${escapeHtml(fixture.title)}</span>
          <small>${escapeHtml(fixture.profileId)} · ${escapeHtml(fixture.profileVersion)}</small>
        </button>
      `;
    })
    .join("");
}

function renderPreview(preview: RunPreview): string {
  return `
    <section class="panel preview-panel">
      <div class="panel-heading">
        <div>
          <p class="step-label">01 · Review contract</p>
          <h2>${escapeHtml(preview.fixtureTitle)}</h2>
        </div>
        <span class="status-pill safe">effects denied</span>
      </div>

      <blockquote>${escapeHtml(preview.prompt)}</blockquote>

      <dl class="facts-grid">
        ${fact("Adapter", `${preview.adapterId} @ ${preview.adapterVersion}`)}
        ${fact("Endpoint", preview.endpointClass)}
        ${fact("Network", preview.networkPolicy)}
        ${fact("Credentials", preview.credentialPolicy)}
        ${fact("Attempts", String(preview.maxAttempts))}
        ${fact("Fixture hash", shortHash(preview.fixtureHash))}
        ${fact("Profile hash", shortHash(preview.profileHash))}
      </dl>

      <details>
        <summary>Proof limits</summary>
        <ul>${preview.proofLimits.map((limit) => `<li>${escapeHtml(limit)}</li>`).join("")}</ul>
      </details>

      <button id="run-fixture" class="primary-action" ${state.busy ? "disabled" : ""}>
        ${state.busy ? "Running…" : "Run local evaluation"}
      </button>
    </section>
  `;
}

function renderReceipt(receipt: RunReceipt, verification: ReceiptVerification | null): string {
  const verificationLabel = verification?.valid ? "internal consistency verified" : "verification failed";
  const verificationClass = verification?.valid ? "safe" : "danger";
  return `
    <section class="panel receipt-panel">
      <div class="panel-heading">
        <div>
          <p class="step-label">02 · Inspect evidence</p>
          <h2>Run receipt</h2>
        </div>
        <span class="status-pill ${verificationClass}">${verificationLabel}</span>
      </div>

      <div class="score-block">
        <strong>${receipt.score.total}</strong>
        <span>/ ${receipt.score.possible}</span>
        <small>fixture-bounded points</small>
      </div>

      <div class="output-block">
        <span>Normalized mock output</span>
        <p>${escapeHtml(receipt.normalizedOutput)}</p>
      </div>

      <div class="score-components">
        ${receipt.score.components.map((component) => `
          <div>
            <span>${escapeHtml(component.id)}</span>
            <strong>${component.awarded}/${component.possible}</strong>
            <small>${escapeHtml(component.evidence)}</small>
          </div>
        `).join("")}
      </div>

      <dl class="facts-grid receipt-facts">
        ${fact("Run", receipt.runId)}
        ${fact("Tokens", `${receipt.inputTokens} in · ${receipt.outputTokens} out · ${receipt.measurementSource}`)}
        ${fact("Output hash", shortHash(receipt.outputHash))}
        ${fact("Reproducibility", shortHash(receipt.reproducibilityHash))}
        ${fact("Receipt hash", shortHash(receipt.receiptHash))}
        ${fact("Bundle", receipt.bundlePath)}
      </dl>

      ${verification ? `
        <details>
          <summary>Integrity checks</summary>
          <ul class="check-list">
            ${verification.checks.map((check) => `<li class="${check.passed ? "pass" : "fail"}"><strong>${escapeHtml(check.id)}</strong> ${escapeHtml(check.detail)}</li>`).join("")}
          </ul>
        </details>
      ` : ""}
    </section>
  `;
}

function renderEmptyReceipt(): string {
  if (state.busy) return "";
  return `
    <section class="panel empty-panel">
      <p class="step-label">02 · Inspect evidence</p>
      <h2>No run receipt yet</h2>
      <p>Review the exact policy above, then run the deterministic local fixture. The Workbench will write and verify the receipt through the Rust boundary.</p>
    </section>
  `;
}

function renderLoading(label: string): string {
  return `<div class="loading" role="status"><span></span>${escapeHtml(label)}</div>`;
}

function renderError(message: string): string {
  return `
    <section class="error-panel" role="alert">
      <strong>The desktop boundary did not answer.</strong>
      <p>${escapeHtml(message)}</p>
      <small>Use the Tauri desktop application. The browser preview cannot invoke native Rust commands.</small>
    </section>
  `;
}

function bindInteractions(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-fixture-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const fixtureId = button.dataset.fixtureId;
      if (fixtureId) void selectFixture(fixtureId);
    });
  });
  document.querySelector<HTMLButtonElement>("#run-fixture")?.addEventListener("click", () => {
    void executeRun();
  });
}

function fact(label: string, value: string): string {
  return `<div><dt>${escapeHtml(label)}</dt><dd title="${escapeAttribute(value)}">${escapeHtml(value)}</dd></div>`;
}

function shortHash(value: string): string {
  return value.length > 20 ? `${value.slice(0, 12)}…${value.slice(-8)}` : value;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

void boot();
