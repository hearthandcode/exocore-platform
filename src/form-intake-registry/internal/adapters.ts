import { readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { typedError, type TypedError } from "../errors";
import { sha256 } from "./hash";
import type {
  AdapterDescriptor,
  Result,
  SourceAdapter,
  SourceBytes,
  SourceKind,
} from "../types";

export interface FileAdapterOptions {
  id: string;
  kind: SourceKind;
  root: string;
  maxBytes?: number;
  now?: () => string;
}

export class BoundedFileSourceAdapter implements SourceAdapter {
  readonly id: string;
  readonly kind: SourceKind;
  private readonly root: string;
  private readonly maxBytes: number;
  private readonly now: () => string;

  constructor(options: FileAdapterOptions) {
    this.id = options.id;
    this.kind = options.kind;
    this.root = realpathSync(options.root);
    this.maxBytes = options.maxBytes ?? 1_048_576;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  describe(): AdapterDescriptor {
    return {
      id: this.id,
      kind: this.kind,
      root_policy: "relative-path-within-canonical-root; symlink escapes denied",
      size_bound: this.maxBytes,
      utf8_policy: "strict",
    };
  }

  read(locator: string): Result<SourceBytes, TypedError> {
    const operation = "ingest.read";
    if (!locator || isAbsolute(locator)) {
      return { ok: false, error: traversal(operation, locator) };
    }
    const requested = resolve(this.root, locator);
    if (requested !== this.root && !requested.startsWith(`${this.root}${sep}`)) {
      return { ok: false, error: traversal(operation, locator) };
    }

    let canonical: string;
    try {
      canonical = realpathSync(requested);
    } catch {
      return {
        ok: false,
        error: typedError("E_NOT_FOUND", operation, "Source locator does not resolve.", {
          path: locator,
          suggestedAction: "Check the relative path or create a fresh export.",
        }),
      };
    }
    if (canonical !== this.root && !canonical.startsWith(`${this.root}${sep}`)) {
      return { ok: false, error: traversal(operation, locator) };
    }

    try {
      const size = statSync(canonical).size;
      if (size > this.maxBytes) {
        return {
          ok: false,
          error: typedError("E_TOO_LARGE", operation, "Source exceeds the configured byte limit.", {
            path: locator,
            suggestedAction: "Use a smaller export or deliberately revise the bound.",
          }),
        };
      }
      const bytes = readFileSync(canonical);
      try {
        new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        return {
          ok: false,
          error: typedError("E_ENCODING", operation, "Source is not valid UTF-8.", {
            path: locator,
            suggestedAction: "Re-export the file as UTF-8.",
          }),
        };
      }
      return {
        ok: true,
        value: {
          bytes,
          locator: relative(this.root, canonical).split(sep).join("/"),
          digest: sha256(bytes),
          read_at: this.now(),
        },
      };
    } catch {
      return {
        ok: false,
        error: typedError("E_NOT_FOUND", operation, "Source could not be read.", {
          path: locator,
          suggestedAction: "Check file permissions and retry.",
        }),
      };
    }
  }
}

export class FormExportFileAdapter extends BoundedFileSourceAdapter {
  constructor(root: string, options: { maxBytes?: number; now?: () => string } = {}) {
    super({ id: "form-export-fs", kind: "form-export", root, ...options });
  }
}

export class HubRegistryReadAdapter extends BoundedFileSourceAdapter {
  constructor(root: string, options: { maxBytes?: number; now?: () => string } = {}) {
    super({ id: "hub-registry-read", kind: "hub-intake-candidate", root, ...options });
  }
}

function traversal(operation: string, locator: string): TypedError {
  return typedError("E_TRAVERSAL", operation, "Source locator escapes the permitted root.", {
    path: locator,
    recoverable: false,
    suggestedAction: "Use a relative locator inside the adapter root.",
  });
}
