import type {
  ArtifactReferenceProjection,
  ArtifactSurfaceProjection,
} from "./contracts";
import { assertArtifactSurfaceProjection } from "./validate";

export interface ArtifactSurfaceBinding {
  selectArtifact: (artifactId: string) => void;
  destroy: () => void;
}

export function renderArtifactSurface(
  projectionValue: unknown,
  selectedArtifactId?: string,
): string {
  const projection = assertArtifactSurfaceProjection(projectionValue);
  const selected =
    projection.artifacts.find((artifact) => artifact.artifactId === selectedArtifactId) ??
    projection.artifacts[0];

  return `
    <section class="artifact-surface" aria-labelledby="artifact-surface-title">
      <header>
        <p class="artifact-surface__eyebrow">Read-only projection · unmounted candidate</p>
        <h2 id="artifact-surface-title">Artifact Surface</h2>
        <p>${escapeHtml(projection.contract.limits.join(" · "))}</p>
      </header>
      <div class="artifact-surface__layout">
        <nav aria-label="Projected artifacts">
          <ul>
            ${projection.artifacts.map((artifact) => renderArtifactButton(artifact, artifact.artifactId === selected.artifactId)).join("")}
          </ul>
        </nav>
        ${renderArtifact(selected, projection)}
      </div>
    </section>
  `;
}

export function bindArtifactSurface(
  root: HTMLElement,
  projectionValue: unknown,
  initialArtifactId?: string,
): ArtifactSurfaceBinding {
  const projection = assertArtifactSurfaceProjection(projectionValue);
  let selectedArtifactId =
    projection.artifacts.find((artifact) => artifact.artifactId === initialArtifactId)?.artifactId ??
    projection.artifacts[0].artifactId;

  const listeners = new Map<HTMLButtonElement, EventListener>();

  const bind = (): void => {
    root.innerHTML = renderArtifactSurface(projection, selectedArtifactId);
    root.querySelectorAll<HTMLButtonElement>("[data-artifact-id]").forEach((button) => {
      const listener: EventListener = () => {
        const nextId = button.dataset.artifactId;
        if (nextId) selectArtifact(nextId);
      };
      button.addEventListener("click", listener);
      listeners.set(button, listener);
    });
  };

  const unbind = (): void => {
    listeners.forEach((listener, button) => button.removeEventListener("click", listener));
    listeners.clear();
  };

  const selectArtifact = (artifactId: string): void => {
    if (!projection.artifacts.some((artifact) => artifact.artifactId === artifactId)) {
      throw new Error(`Unknown Artifact Surface selection: ${artifactId}`);
    }
    unbind();
    selectedArtifactId = artifactId;
    bind();
  };

  bind();
  return {
    selectArtifact,
    destroy: () => {
      unbind();
      root.replaceChildren();
    },
  };
}

function renderArtifactButton(
  artifact: ArtifactReferenceProjection,
  selected: boolean,
): string {
  return `<li><button type="button" data-artifact-id="${escapeAttribute(artifact.artifactId)}" aria-pressed="${selected}"><span>${escapeHtml(artifact.title)}</span><small>${escapeHtml(artifact.artifactClass)} · ${escapeHtml(artifact.reviewState)}</small></button></li>`;
}

function renderArtifact(
  artifact: ArtifactReferenceProjection,
  projection: ArtifactSurfaceProjection,
): string {
  const relations = artifact.relations.map((relation) => {
    const target = projection.artifacts.find((candidate) => candidate.artifactId === relation.targetArtifactId);
    return `<li><span>${escapeHtml(relation.kind)}</span> ${escapeHtml(target?.title ?? relation.targetArtifactId)}</li>`;
  });

  return `
    <article aria-labelledby="artifact-title-${escapeAttribute(artifact.artifactId)}">
      <div class="artifact-surface__states" aria-label="Artifact states">
        <span>${escapeHtml(artifact.artifactClass)}</span>
        <span>${escapeHtml(artifact.lifecycleState)}</span>
        <span>${escapeHtml(artifact.reviewState)}</span>
        <span>${escapeHtml(artifact.sensitivity)}</span>
      </div>
      <h3 id="artifact-title-${escapeAttribute(artifact.artifactId)}">${escapeHtml(artifact.title)}</h3>
      <p>${escapeHtml(artifact.summary)}</p>
      <dl>
        ${fact("Artifact ID", artifact.artifactId)}
        ${fact("On-disk path", artifact.artifactPath)}
        ${fact("Content digest", artifact.contentDigest)}
        ${fact("Provenance", artifact.provenance.sourceLabel)}
      </dl>
      <section aria-labelledby="artifact-preview-title">
        <h4 id="artifact-preview-title">Bounded content preview</h4>
        <pre>${escapeHtml(artifact.contentPreview.text)}</pre>
        <p>${artifact.contentPreview.truncated ? "Preview is truncated." : "Complete synthetic fixture preview."}</p>
      </section>
      <section aria-labelledby="artifact-provenance-title">
        <h4 id="artifact-provenance-title">Provenance</h4>
        <p>${escapeHtml(artifact.provenance.summary)}</p>
      </section>
      <section aria-labelledby="artifact-relations-title">
        <h4 id="artifact-relations-title">Graph neighbors</h4>
        ${relations.length > 0 ? `<ul>${relations.join("")}</ul>` : "<p>No projected relations.</p>"}
      </section>
    </article>
  `;
}

function fact(label: string, value: string): string {
  return `<div><dt>${escapeHtml(label)}</dt><dd title="${escapeAttribute(value)}">${escapeHtml(value)}</dd></div>`;
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
