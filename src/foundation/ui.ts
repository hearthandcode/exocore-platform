import { availableFoundationRoutes } from "./routes";
import type { FoundationViewState } from "./store";

export function renderFoundationPanel(state: FoundationViewState): string {
  const status = state.status;
  const routes = availableFoundationRoutes(status);
  return `
    <section class="boundary-card" aria-labelledby="foundation-heading">
      <p class="eyebrow">Modular-monolith foundation · structural proof</p>
      <h2 id="foundation-heading">Foundation mount boundary</h2>
      <p class="section-note">Deny by default · typed IPC · local-only actor proof</p>
      ${state.error ? `<p role="alert"><strong>${escapeHtml(state.error.code)}</strong> ${escapeHtml(state.error.message)}</p>` : ""}
      ${
        status
          ? `
        <dl>
          <div><dt>Mount contract</dt><dd>${escapeHtml(status.mount_contract)}</dd></div>
          <div><dt>Authority default</dt><dd>${escapeHtml(status.default_authority)}</dd></div>
          <div><dt>Registered modules</dt><dd>${status.registered_modules}</dd></div>
          <div><dt>Actor health</dt><dd>${status.actor_healthy ? "healthy" : "unavailable"}</dd></div>
          <div><dt>Skeleton route</dt><dd>${status.skeleton_ui_enabled ? "enabled" : "disabled (safe default)"}</dd></div>
        </dl>
        <button id="toggle-foundation" type="button" aria-pressed="${status.skeleton_ui_enabled}">
          ${status.skeleton_ui_enabled ? "Disable" : "Exercise"} skeleton route
        </button>
        ${
          routes.length
            ? `
          <div data-foundation-route="foundation-status">
            <label for="foundation-echo">Bounded actor echo</label>
            <input id="foundation-echo" maxlength="256" value="foundation-proof" />
            <button id="run-foundation-echo" type="button">Run typed echo</button>
            ${state.echo ? `<p><strong>Echo:</strong> ${escapeHtml(state.echo.message)} · ${escapeHtml(state.echo.correlation_id)}</p>` : ""}
          </div>
        `
            : "<p>The route is absent while its native flag is off.</p>"
        }
      `
          : `<p>${state.loading ? "Loading native foundation status…" : "Foundation status has not been loaded."}</p>`
      }
    </section>
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
